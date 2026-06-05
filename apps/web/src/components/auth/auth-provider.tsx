"use client";

import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  type Unsubscribe,
  type User
} from "firebase/auth";
import type { UserProfile } from "@prode/shared";
import { APP_ROUTES } from "@prode/shared";
import { webConfig } from "@/config/app";
import { copyForLocale, readCurrentLocale } from "@/lib/i18n/locale-provider";
import { ApiClientError, getMyProfile } from "@/lib/api/client";
import { ensureFirebaseAuthPersistence, firebaseAuth, firebaseClientEnabled } from "@/lib/firebase/client";
import { markFirstLogin } from "@/lib/auth/first-login-tracker";

const MAGIC_LINK_EMAIL_KEY = "prode-mundial:magic-link-email";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
  isConfigured: boolean;
  isEmailLink: boolean;
  errorMessage: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function readStoredMagicLinkEmail() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
}

function storeMagicLinkEmail(email: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, email);
}

function clearStoredMagicLinkEmail() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
}

function getFirebaseErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof (error as FirebaseError).code === "string") {
    return (error as FirebaseError).code;
  }

  return null;
}

function toFriendlyAuthError(error: unknown, esFallback: string, enFallback: string) {
  const locale = readCurrentLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      return new Error(t("Tu sesión venció o dejó de ser válida. Volvé a iniciar sesión.", "Your session expired or is no longer valid. Sign in again."));
    }

    return new Error(error.message);
  }

  const code = getFirebaseErrorCode(error);

  switch (code) {
    case "auth/popup-closed-by-user":
      return new Error(t("Cerraste la ventana de Google antes de terminar el ingreso.", "You closed the Google window before finishing sign-in."));
    case "auth/cancelled-popup-request":
      return new Error(t("Ya había un intento de login con Google en curso. Esperá un instante e intentá de nuevo.", "A Google sign-in attempt was already in progress. Wait a moment and try again."));
    case "auth/popup-blocked":
      return new Error(t("Tu navegador bloqueó la ventana de Google. Habilitá popups e intentá nuevamente.", "Your browser blocked the Google window. Enable pop-ups and try again."));
    case "auth/invalid-email":
      return new Error(t("El email ingresado no es válido.", "The email you entered is not valid."));
    case "auth/missing-email":
      return new Error(t("Necesitamos tu email para enviarte el magic link.", "We need your email to send you the magic link."));
    case "auth/invalid-action-code":
      return new Error(t("Este magic link no es válido o ya fue usado.", "This magic link is invalid or has already been used."));
    case "auth/expired-action-code":
      return new Error(t("Este magic link expiró. Pedí uno nuevo para volver a entrar.", "This magic link expired. Request a new one to sign in again."));
    case "auth/network-request-failed":
      return new Error(t("Tuvimos un problema de red. Revisá tu conexión e intentá nuevamente.", "We hit a network problem. Check your connection and try again."));
    default:
      if (error instanceof Error && error.message.trim().length > 0) {
        return new Error(error.message);
      }

      return new Error(t(esFallback, enFallback));
  }
}

async function clearExpiredSession() {
  if (!firebaseAuth) {
    return;
  }

  await signOut(firebaseAuth).catch(() => undefined);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>(firebaseClientEnabled ? "loading" : "idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEmailLink, setIsEmailLink] = useState(false);

  async function refreshProfile(nextUser?: User | null) {
    const activeUser = nextUser ?? user;

    if (!activeUser) {
      setProfile(null);
      return null;
    }

    const token = await activeUser.getIdToken();
    const nextProfile = await getMyProfile(token);
    setProfile(nextProfile);
    return nextProfile;
  }

  useEffect(() => {
    if (!firebaseAuth) {
      setStatus("idle");
      return;
    }

    const auth = firebaseAuth;
    setIsEmailLink(typeof window !== "undefined" && isSignInWithEmailLink(auth, window.location.href));

    let isMounted = true;
    let unsubscribe: Unsubscribe = () => undefined;

    ensureFirebaseAuthPersistence()
      .then(() => {
        unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
          if (!isMounted) {
            return;
          }

          setUser(nextUser);

          if (!nextUser) {
            setProfile(null);
            setStatus("unauthenticated");
            return;
          }

          setStatus("loading");

          try {
            await refreshProfile(nextUser);
            if (isMounted) {
              markFirstLogin();
              setStatus("authenticated");
            }
          } catch (error) {
            if (error instanceof ApiClientError && error.status === 401) {
              await clearExpiredSession();

              if (isMounted) {
                setUser(null);
                setProfile(null);
                setErrorMessage(copyForLocale(readCurrentLocale(), "Tu sesión venció o dejó de ser válida. Volvé a iniciar sesión.", "Your session expired or is no longer valid. Sign in again."));
                setStatus("unauthenticated");
              }

              return;
            }

            if (isMounted) {
              setErrorMessage(toFriendlyAuthError(error, "No se pudo cargar la sesión.", "We couldn't load your session.").message);
              setStatus("error");
            }
          }
        });
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(toFriendlyAuthError(error, "No se pudo inicializar Firebase Auth.", "We couldn't initialize Firebase Auth.").message);
          setStatus("error");
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  async function signInWithGoogleAction() {
    if (!firebaseAuth) {
      throw new Error(copyForLocale(readCurrentLocale(), "Firebase Auth no está configurado.", "Firebase Auth is not configured."));
    }

    setErrorMessage(null);
    setStatus("loading");

    try {
      await ensureFirebaseAuthPersistence();
      await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    } catch (error) {
      setStatus(user ? "authenticated" : "unauthenticated");
      throw toFriendlyAuthError(error, "No pudimos iniciar con Google.", "We couldn't sign you in with Google.");
    }
  }

  async function sendMagicLinkAction(email: string) {
    if (!firebaseAuth) {
      throw new Error(copyForLocale(readCurrentLocale(), "Firebase Auth no está configurado.", "Firebase Auth is not configured."));
    }

    setErrorMessage(null);
    try {
      await ensureFirebaseAuthPersistence();
      // Redirigimos al callback dedicado (NO a /login) para que el user reciba
      // una pantalla con un solo CTA "Ingresá aquí" y los pre-fetchers de Gmail/
      // Outlook no consuman el oobCode antes que el user real.
      await sendSignInLinkToEmail(firebaseAuth, email, {
        url: `${webConfig.webUrl}${APP_ROUTES.authCallback}`,
        handleCodeInApp: true
      });
      storeMagicLinkEmail(email);
    } catch (error) {
      throw toFriendlyAuthError(error, "No pudimos enviar el magic link.", "We couldn't send the magic link.");
    }
  }

  async function completeMagicLinkAction(email: string) {
    if (!firebaseAuth || typeof window === "undefined") {
      throw new Error(copyForLocale(readCurrentLocale(), "Firebase Auth no está configurado.", "Firebase Auth is not configured."));
    }

    setErrorMessage(null);
    setStatus("loading");
    try {
      await ensureFirebaseAuthPersistence();
      await signInWithEmailLink(firebaseAuth, email, window.location.href);
      clearStoredMagicLinkEmail();
    } catch (error) {
      setStatus(user ? "authenticated" : "unauthenticated");
      throw toFriendlyAuthError(error, "No pudimos completar el ingreso por email.", "We couldn't complete your email sign-in.");
    }
  }

  async function logoutAction() {
    if (!firebaseAuth) {
      return;
    }

    await signOut(firebaseAuth);
    setProfile(null);
    setUser(null);
    setStatus("unauthenticated");
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      status,
      isConfigured: firebaseClientEnabled,
      isEmailLink,
      errorMessage,
      clearError: () => setErrorMessage(null),
      signInWithGoogle: signInWithGoogleAction,
      sendMagicLink: sendMagicLinkAction,
      completeMagicLink: async (email: string) => {
        const effectiveEmail = email.trim() || readStoredMagicLinkEmail() || "";

        if (!effectiveEmail) {
          throw new Error("Necesitamos el email usado para enviarte el magic link.");
        }

        await completeMagicLinkAction(effectiveEmail);
      },
      logout: logoutAction,
      refreshProfile: () => refreshProfile()
    }),
    [errorMessage, isEmailLink, profile, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}

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

function readStoredMagicLinkEmail() {
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

function toFriendlyAuthError(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      return new Error("Tu sesión venció o dejó de ser válida. Volvé a iniciar sesión.");
    }

    return new Error(error.message);
  }

  const code = getFirebaseErrorCode(error);

  switch (code) {
    case "auth/popup-closed-by-user":
      return new Error("Cerraste la ventana de Google antes de terminar el ingreso.");
    case "auth/cancelled-popup-request":
      return new Error("Ya había un intento de login con Google en curso. Esperá un instante e intentá de nuevo.");
    case "auth/popup-blocked":
      return new Error("Tu navegador bloqueó la ventana de Google. Habilitá popups e intentá nuevamente.");
    case "auth/invalid-email":
      return new Error("El email ingresado no es válido.");
    case "auth/missing-email":
      return new Error("Necesitamos tu email para enviarte el magic link.");
    case "auth/invalid-action-code":
      return new Error("Este magic link no es válido o ya fue usado.");
    case "auth/expired-action-code":
      return new Error("Este magic link expiró. Pedí uno nuevo para volver a entrar.");
    case "auth/network-request-failed":
      return new Error("Tuvimos un problema de red. Revisá tu conexión e intentá nuevamente.");
    default:
      if (error instanceof Error && error.message.trim().length > 0) {
        return new Error(error.message);
      }

      return new Error(fallbackMessage);
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
                setErrorMessage("Tu sesión venció o dejó de ser válida. Volvé a iniciar sesión.");
                setStatus("unauthenticated");
              }

              return;
            }

            if (isMounted) {
              setErrorMessage(toFriendlyAuthError(error, "No se pudo cargar la sesión.").message);
              setStatus("error");
            }
          }
        });
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(toFriendlyAuthError(error, "No se pudo inicializar Firebase Auth.").message);
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
      throw new Error("Firebase Auth no está configurado.");
    }

    setErrorMessage(null);
    setStatus("loading");

    try {
      await ensureFirebaseAuthPersistence();
      await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    } catch (error) {
      setStatus(user ? "authenticated" : "unauthenticated");
      throw toFriendlyAuthError(error, "No pudimos iniciar con Google.");
    }
  }

  async function sendMagicLinkAction(email: string) {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth no está configurado.");
    }

    setErrorMessage(null);
    try {
      await ensureFirebaseAuthPersistence();
      await sendSignInLinkToEmail(firebaseAuth, email, {
        url: `${webConfig.webUrl}${APP_ROUTES.login}`,
        handleCodeInApp: true
      });
      storeMagicLinkEmail(email);
    } catch (error) {
      throw toFriendlyAuthError(error, "No pudimos enviar el magic link.");
    }
  }

  async function completeMagicLinkAction(email: string) {
    if (!firebaseAuth || typeof window === "undefined") {
      throw new Error("Firebase Auth no está configurado.");
    }

    setErrorMessage(null);
    setStatus("loading");
    try {
      await ensureFirebaseAuthPersistence();
      await signInWithEmailLink(firebaseAuth, email, window.location.href);
      clearStoredMagicLinkEmail();
    } catch (error) {
      setStatus(user ? "authenticated" : "unauthenticated");
      throw toFriendlyAuthError(error, "No pudimos completar el ingreso por email.");
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

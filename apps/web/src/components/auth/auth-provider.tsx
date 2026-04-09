"use client";

import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
import { getMyProfile } from "@/lib/api/client";
import { ensureFirebaseAuthPersistence, firebaseAuth, firebaseClientEnabled } from "@/lib/firebase/client";

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
              setStatus("authenticated");
            }
          } catch (error) {
            if (isMounted) {
              setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar la sesión.");
              setStatus("error");
            }
          }
        });
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "No se pudo inicializar Firebase Auth.");
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
      throw error;
    }
  }

  async function sendMagicLinkAction(email: string) {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth no está configurado.");
    }

    setErrorMessage(null);
    await ensureFirebaseAuthPersistence();
    await sendSignInLinkToEmail(firebaseAuth, email, {
      url: `${webConfig.webUrl}${APP_ROUTES.login}`,
      handleCodeInApp: true
    });
    storeMagicLinkEmail(email);
  }

  async function completeMagicLinkAction(email: string) {
    if (!firebaseAuth || typeof window === "undefined") {
      throw new Error("Firebase Auth no está configurado.");
    }

    setErrorMessage(null);
    setStatus("loading");
    await ensureFirebaseAuthPersistence();
    await signInWithEmailLink(firebaseAuth, email, window.location.href);
    clearStoredMagicLinkEmail();
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

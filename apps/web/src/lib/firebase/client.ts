import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { webConfig } from "@/config/app";

function hasFirebaseClientConfig() {
  return Object.values(webConfig.firebase).every((value) => value.length > 0);
}

const firebaseApp = hasFirebaseClientConfig()
  ? getApps()[0] ??
    initializeApp({
      apiKey: webConfig.firebase.apiKey,
      authDomain: webConfig.firebase.authDomain,
      projectId: webConfig.firebase.projectId,
      storageBucket: webConfig.firebase.storageBucket,
      messagingSenderId: webConfig.firebase.messagingSenderId,
      appId: webConfig.firebase.appId
    })
  : null;

export const firebaseClientEnabled = firebaseApp !== null;

export const firebaseAuth = firebaseApp ? getAuth(getApps()[0] ?? getApp()) : null;

let persistenceReady: Promise<void> | null = null;

export function ensureFirebaseAuthPersistence() {
  if (!firebaseAuth) {
    return Promise.resolve();
  }

  if (!persistenceReady) {
    persistenceReady = setPersistence(firebaseAuth, browserLocalPersistence);
  }

  return persistenceReady;
}

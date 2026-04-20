import { getApp, getApps } from "firebase/app";
import type { Messaging, MessagePayload, Unsubscribe } from "firebase/messaging";
import { webConfig } from "@/config/app";

let messagingPromise: Promise<Messaging | null> | null = null;
let readyMessaging: Messaging | null = null;

function isClient() {
  return typeof window !== "undefined";
}

function hasVapidKey() {
  return webConfig.firebase.vapidKey.length > 0;
}

async function resolveMessaging(): Promise<Messaging | null> {
  if (!isClient() || getApps().length === 0) return null;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return null;

  const mod = await import("firebase/messaging");
  const supported = await mod.isSupported();
  if (!supported) return null;

  const instance = mod.getMessaging(getApp());
  readyMessaging = instance;
  return instance;
}

export function initMessaging(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = resolveMessaging().catch((error) => {
      console.warn("[messaging] init failed", error);
      return null;
    });
  }
  return messagingPromise;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isClient() || !("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

async function ensureRegistrationActive(
  registration: ServiceWorkerRegistration
): Promise<ServiceWorkerRegistration> {
  if (registration.active) return registration;

  const worker = registration.installing ?? registration.waiting;
  if (!worker) return registration;

  await new Promise<void>((resolve) => {
    const onChange = () => {
      if (worker.state === "activated") {
        worker.removeEventListener("statechange", onChange);
        resolve();
      }
    };
    worker.addEventListener("statechange", onChange);
  });

  return registration;
}

export async function getFcmToken(): Promise<string | null> {
  if (!hasVapidKey()) {
    console.warn("[messaging] missing NEXT_PUBLIC_FIREBASE_VAPID_KEY");
    return null;
  }

  const instance = readyMessaging ?? (await initMessaging());
  if (!instance) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/firebase-cloud-messaging-push-scope" }
    );
    await ensureRegistrationActive(registration);

    const mod = await import("firebase/messaging");
    const token = await mod.getToken(instance, {
      vapidKey: webConfig.firebase.vapidKey,
      serviceWorkerRegistration: registration
    });

    return token.length > 0 ? token : null;
  } catch (error) {
    console.warn("[messaging] getFcmToken failed", error);
    return null;
  }
}

export async function onForegroundMessage(
  handler: (payload: MessagePayload) => void
): Promise<Unsubscribe | null> {
  const instance = readyMessaging ?? (await initMessaging());
  if (!instance) return null;

  const mod = await import("firebase/messaging");
  return mod.onMessage(instance, handler);
}

import type { User as FirebaseUser } from "firebase/auth";
import { registerFcmToken } from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";
import { getFcmToken } from "@/lib/firebase/messaging";

export async function syncFcmToken(user: FirebaseUser): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;

  const fcmToken = await getFcmToken();
  if (!fcmToken) return null;

  try {
    const authToken = await user.getIdToken();
    await registerFcmToken(authToken, {
      fcmToken,
      platform: "web",
      userAgent: navigator.userAgent
    });
    track("fcm_token_registered");
    return fcmToken;
  } catch (error) {
    console.warn("[fcm-sync] register failed", error);
    return null;
  }
}

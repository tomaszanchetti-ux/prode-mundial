"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { syncFcmToken } from "@/lib/firebase/fcm-sync";

export function FcmSync() {
  const { status, user } = useAuth();

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    void syncFcmToken(user);
  }, [status, user]);

  return null;
}

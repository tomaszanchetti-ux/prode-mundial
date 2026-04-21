"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/firebase/analytics";

export function AnalyticsInit() {
  useEffect(() => {
    void initAnalytics();
  }, []);
  return null;
}

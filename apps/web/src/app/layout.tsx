import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { ConsentProvider } from "@/lib/consent/consent-provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { AnalyticsInit } from "@/components/analytics/analytics-init";
import { GoogleConsentDefault } from "@/components/consent/google-consent-default";
import { ConsentBanner } from "@/components/consent/consent-banner";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://prode-mundial-2026--prode-mundial-4e419.europe-west4.hosted.app";

const SITE_NAME = "Prode Mundial";
const SITE_DESCRIPTION =
  "Pronosticá los partidos del Mundial 2026, competí en ligas privadas y sumá puntos.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prode"
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }]
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION
  },
  robots: {
    index: true,
    follow: true
  },
  formatDetection: {
    telephone: false
  },
  other: {
    "msapplication-TileColor": "#0052CC",
    "msapplication-TileImage": "/icon-192.png",
    "mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0052CC" },
    { media: "(prefers-color-scheme: dark)", color: "#0052CC" }
  ]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <GoogleConsentDefault />
        <link
          rel="apple-touch-startup-image"
          href="/apple-splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/apple-splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/apple-splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
      </head>
      <body className="app-body-bg">
        <LocaleProvider>
          <ConsentProvider>
            <AuthProvider>{children}</AuthProvider>
            <ConsentBanner />
            <AnalyticsInit />
          </ConsentProvider>
        </LocaleProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

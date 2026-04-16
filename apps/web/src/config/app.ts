export const webConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Prode Mundial",
  webUrl: process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000",
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? ""
  }
} as const;

export const webConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Prode Mundial",
  devSessionToken: process.env.NEXT_PUBLIC_DEV_SESSION_TOKEN ?? "dev-user"
} as const;

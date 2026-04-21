import type { PublicBootstrap } from "../contracts/bootstrap";

export const APP_NAME = "Prode Mundial";

export const MAIN_TABS = [
  { key: "home", label: "Inicio", href: "/home" },
  { key: "tournament", label: "Predicciones", href: "/tournament" },
  { key: "worldCup", label: "Resultados", href: "/world-cup" },
  { key: "leagues", label: "Mis Ligas", href: "/leagues" }
] as const;

export const SUPPORT_LINKS = [
  { label: "Reglas y puntos", href: "/rules" },
  { label: "Términos", href: "/terms" },
  { label: "Privacidad", href: "/privacy" }
] as const;

export const DEFAULT_PUBLIC_BOOTSTRAP: PublicBootstrap = {
  productName: APP_NAME,
  tagline: "Predice el Mundial en segundos, compite con amigos y suma puntos cada día.",
  features: ["Predicciones de partidos", "Puntos diarios", "Ligas privadas"],
  authProviders: {
    google: true,
    magicLink: true
  }
};

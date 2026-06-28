// Aviso único (one-time) sobre la nueva mecánica de cruces: al empatar podés
// elegir quién pasa y sumás +1. Se persiste en localStorage; NO toca la DB.

const ADVANCER_BANNER_SEEN_KEY = "prode_advancer_banner_seen";

export function hasSeenAdvancerBanner(): boolean {
  if (typeof window === "undefined") {
    // SSR: no mostrar hasta hidratar (el efecto del cliente lo resuelve).
    return true;
  }

  try {
    return window.localStorage.getItem(ADVANCER_BANNER_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markAdvancerBannerSeen(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ADVANCER_BANNER_SEEN_KEY, "1");
  } catch {
    // quota / modo privado: lo ignoramos silenciosamente.
  }
}

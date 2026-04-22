const PICKS_COUNT_KEY = "prode_picks_completed_count";
const POST_PICK_PROMPT_SHOWN_KEY = "prode_install_post_pick_shown";

export const FIRST_PICK_COMPLETED_EVENT = "prode:first-pick-completed";

function readCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(PICKS_COUNT_KEY);
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function writeCount(value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PICKS_COUNT_KEY, String(value));
}

/**
 * Marca que un pick se guardó exitosamente. Si es el primero, dispara
 * el evento custom que el prompt de install escucha. Safe de llamar
 * desde cualquier lugar (múltiples screens, tipos de pick).
 */
export function recordPickCompletion() {
  if (typeof window === "undefined") return;
  const previous = readCount();
  writeCount(previous + 1);
  if (previous === 0) {
    window.dispatchEvent(new Event(FIRST_PICK_COMPLETED_EVENT));
  }
}

export function hasPostPickPromptBeenShown(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(POST_PICK_PROMPT_SHOWN_KEY) === "1";
}

export function markPostPickPromptShown() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(POST_PICK_PROMPT_SHOWN_KEY, "1");
}

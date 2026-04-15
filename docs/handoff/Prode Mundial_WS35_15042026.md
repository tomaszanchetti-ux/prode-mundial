# Prode Mundial — WS35 (15/04/2026)

## Contexto
FASE 1C del MASTER_PLAN: rediseño UI a **light mode**. Metodología
card-by-card (cada card = unidad pequeña reviewable, no dividir por WS).

Branch: `epic/08-ui-redesign-light-mode` (en progreso, no mergeada).

## Paleta "Stadium Light"
Referencias: FotMob / ESPN / Sofascore.

| Token | Valor |
|---|---|
| `--color-primary-500` | `#0052CC` |
| `--color-bg-main` | `#F7F8FA` |
| `--color-bg-surface` | `#FFFFFF` |
| `--color-text-primary` | `#0E1116` |
| `--shadow-soft` | `0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06)` |

## Cards ejecutadas (C1–C6) ✅
- **C1** — Tokens `@theme` en `apps/web/src/app/globals.css` a paleta clara.
- **C2** — ~25 clases component (`btn-*`, `status-*`, `card-base`,
  `surface-inset`, `hero-*`, `score-*`, `flag-fallback-bg`, `modal-*`,
  `alert-*`, etc.) reescritas.
- **C3** — Bottom-nav + "Mi" link del protected layout + language-toggle.
- **C4** — Login-screen (grid responsive `md:grid-cols-[1.1fr_0.9fr]`).
- **C5a** — Fixes residuales: shadow de bandera, border score-display,
  error text en `packages/ui/src/components.tsx`.
- **C5b** — Split home-screen (587 → 168 líneas): dispatcher +
  `home-pre-tournament-view` + `home-in-tournament-view` + `home-states`
  + `home-helpers` (10 fns puras). Export `HomeScreenView` / `HomeScreen`
  intacto.
- **C6** — `matches-screen.tsx` a clases semánticas (`.alert-error`,
  `.filter-bar-bg`, `.filter-chip-*`, `.next-window-bg`, skeletons).

Tests: **29/29 pass**.

## Gotcha importante
Turbopack no invalida cambios en `@layer components` de globals.css por
HMR. Workaround: `touch apps/web/src/app/globals.css` fuerza recompile.
Memoria persistente: `memory/feedback_prode_turbopack_css_hmr.md`.

## Próximas cards (WS siguiente)
- **C7** — `match-detail-screen.tsx` (515 líneas). Light mode + evaluar split.
- **C8** — `leagues-screen` + `league-detail-screen` (+ copy-to-clipboard
  en links de invite).
- **C9** — `rankings-screen`.
- **C10** — `macro-picks-screen` (755 líneas, split 4-5 componentes).
- **C11** — `tournament-screen` + `profile-screen`.
- **C12** — Modales: `marathon-prediction-modal` + `quick-prediction-modal`.
- **C13** — QA sub-agente sobre `git diff main` + decisión de merge.

## Commit
`ff29570` — `feat(ui): FASE 1C light mode fundacion + split home-screen (WS35 C1-C6)`

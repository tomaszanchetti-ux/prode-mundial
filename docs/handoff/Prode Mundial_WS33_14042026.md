# Prode Mundial — WS33 (14/04/2026)

## Objetivo
FASE 1B — Migración masiva de screens restantes de inline styles → Tailwind className

## Branch
`epic/07-tailwind-migration` (sigue viva, sin commit aún — pendiente aprobación Tomás)

## Screens migradas (10 en esta sesión)

1. **home-screen.tsx** (587 líneas) — ~40 inline styles convertidos
2. **matches-screen.tsx** — filter chips con clases `filter-chip-active/inactive`
3. **match-detail-screen.tsx** — toast convertido, reuso de `alert-error`
4. **leagues-screen.tsx** — removida `inputStyle`, reuso de `email-input`
5. **league-detail-screen.tsx** — sin CSS nueva, reuso de patrones Metric
6. **rankings-screen.tsx** — helpers `toStandingRowClass` / `toPositionColor` para filas condicionales
7. **macro-picks-screen.tsx** (755 líneas, la más grande) — removida `selectStyle`, reuso de `hero-worldcup-bg`
8. **profile-screen.tsx** — reuso de `league-action-bg` + `email-input`
9. **tournament-screen.tsx** (361 líneas) — `GroupStandingsCard` con grid 4 cols + filas condicionales
10. **(public)/page.tsx** (landing) — **verificado visualmente en preview** ✅

## CSS classes nuevas en `globals.css`

### Filter bar / Next window
- `filter-bar-bg`, `filter-chip`, `filter-chip-active`, `filter-chip-inactive`
- `next-window-bg`

### Toasts
- `toast-base`, `toast-success`, `toast-error` (sticky pill notification)

### Ligas
- `league-action-bg` (radial + linear gradient)

### Rankings
- `standing-me`, `standing-leader`, `standing-podium`, `standing-default`

### Forms
- `select-input` (min-height 48px, bg muted)
- `alert-warning` (panel ámbar)

### Landing
- `landing-hero-bg` (hero gradient con shadow)
- `landing-cta-primary`, `landing-cta-secondary` (botones 52px)
- `landing-pill-link` (pill "Entrar" 44px)

## Patrones consolidados

- `<div style={{ display: "grid", gap: spacing[16] }}>` → `<div className="grid gap-4">`
- `<h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>` → `<h1 className="typo-h1 m-0 text-text-primary">`
- `<Card elevated style={{ gap, padding }}>` — Card conserva `style` (maneja layout interno)
- Skeletons: `<div className="w-[124px] h-[10px] rounded-full bg-[rgba(148,163,184,0.16)]" />`
- Info panels: `className="grid gap-2 p-3 rounded-md bg-[rgba(255,255,255,0.03)] border border-border-default"`
- Filas con estilo condicional: clase CSS por variante + template literal en className

## Métricas
- **10 screens** migradas · tsc limpio en todas
- **~15 CSS classes** nuevas en `globals.css`
- Preview verificado en landing (única pantalla pública, resto son auth-gated)
- 0 regresiones detectadas

## Git status al cierre
Modificados (sin commitear):
- `apps/web/src/app/(public)/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/home/home-screen.tsx`
- `apps/web/src/components/leagues/league-detail-screen.tsx`
- `apps/web/src/components/leagues/leagues-screen.tsx`
- `apps/web/src/components/macro-picks/macro-picks-screen.tsx`
- `apps/web/src/components/matches/match-detail-screen.tsx`
- `apps/web/src/components/matches/matches-screen.tsx`
- `apps/web/src/components/profile/profile-screen.tsx`
- `apps/web/src/components/rankings/rankings-screen.tsx`
- `apps/web/src/components/tournament/tournament-screen.tsx`

## Pendiente FASE 1B (próxima sesión)

### Archivos con imports legacy (`colors/radii/spacing/typography`):
1. **marathon-prediction-modal.tsx** — el modal grande multi-partido
2. **league-invite-screen.tsx**
3. **terms/page.tsx**, **rules/page.tsx**, **privacy/page.tsx** — páginas estáticas
4. **login/page.tsx**, **leagues/join/page.tsx** — solo `colors` (cambios chicos)
5. **layout.tsx** — solo `appBackgroundStyle` (verificar si el helper sigue vivo)

### Tareas al cierre de FASE 1B:
- Eliminar `packages/ui/src/tokens.ts` (si ya no se importa)
- QA sub-agente sobre `git diff main` completo de la EPIC 07
- Correr tests: `corepack pnpm test`
- Presentar reporte a Tomás → aprobación → merge a main

## Contadores
- Branch: `epic/07-tailwind-migration`
- Screens pendientes: **~5-6** (1 modal grande + 3 estáticas + 2-3 chicas)

## Próximo paso
WS34 → arrancar con `marathon-prediction-modal.tsx` (el más complejo que queda).

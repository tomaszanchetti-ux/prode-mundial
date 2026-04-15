# Prode Mundial — WS36 (15/04/2026)

## Contexto
Continuación de FASE 1C (light mode card-by-card). Branch en curso:
`epic/08-ui-redesign-light-mode` — mismo que WS35. Sin commit al cierre
de esta WS (cambios quedan working tree, pendiente revisar + commitear
antes de C13).

## Cards ejecutadas (C7–C12) ✅

### C7 — match-detail-screen (fix quirúrgico, sin split)
Archivo 481 líneas (menor a lo estimado: 515 → 481), estructura ya
coherente con helpers + view + container. Sin valor real en split.
- `bg-[rgba(255,255,255,0.03)] border border-border-default` →
  `surface-inset` (card de reglas de scoring).
- `text-[#F5B4B4]` eliminado del `<p>` dentro de `alert-error` (hereda
  el color `#B42318` de la clase).

### C8 — leagues + league-detail + league-invite + CopyButton
- Nueva clase `.copy-btn` / `.copy-btn-copied` en globals.css.
- Nuevo componente `apps/web/src/components/leagues/copy-button.tsx`
  (clipboard API + feedback "Copiado" 1.8s).
- **leagues-screen:** 5 reemplazos (`surface-inset` / `bg-bg-muted`),
  `text-[#FCA5A5]` → `text-error`, CopyButton en 2 invite link boxes.
- **league-detail-screen:** 3 reemplazos, CopyButton para invite link +
  nueva row con CopyButton para invite code.
- **league-invite-screen:** 5 reemplazos (skeletons + 3 metrics).

### C9 — rankings-screen (+ actualizaciones en standing classes)
- `.standing-podium` y `.standing-default` migradas a light mode
  (gold-soft y bg-surface respectivamente, antes rgba white
  translucentes invisibles).
- rankings-screen: 4 patrones reemplazados (recent matches, skeletons,
  empty state con background inline, league info box, Metric helper).

### C10 — macro-picks split + light mode (750 → 460 main)
Split en 4 archivos nuevos:

| Archivo | Líneas |
|---|---|
| `macro-picks-screen.tsx` (view + container) | 460 |
| `macro-picks-helpers.ts` (cloneGroupPicks, buildInitial*, formatDeadline, resolveStatusMeta) | 72 |
| `macro-picks-cards.tsx` (GroupPickerCard + MacroSummaryCard + renderTeamSummary) | 122 |
| `macro-picks-editor.tsx` (sección editable: grupos + finalistas + campeón) | 92 |
| `macro-picks-adjustment.tsx` (sección ajuste post-grupos) | 90 |

Exports intactos (`MacroPicksScreenView`, `MacroPicksScreen`) para no
romper los 4 tests del componente. Nueva clase `.alert-info` en
globals.css (tono primary para feedback messages; reemplaza cards con
`borderColor` inline rgba).

### C11 — tournament + profile
- **tournament-screen:** `surface-inset` en tabla de standings;
  filas clasificadas con `bg-primary-soft` + `text-primary-600` (antes
  `text-[#9BE5B6]`); filas no-clasificadas con `bg-bg-surface`; 3
  skeletons → `bg-bg-muted`; card error con `borderColor` inline +
  `text-[#F5B4B4]` → `<div class="alert-error">`.
- **profile-screen:** 2 reemplazos → `surface-inset`.
- **`.league-action-bg`** migrada a light (era gradiente dark). Afecta
  leagues-screen (lastActionLeague card) y profile hero.

### C12 — marathon modal + auth-guard + toasts
- **marathon-prediction-modal:** 2 boxes inline dark bg →
  `surface-inset` (progreso global + "sigue después").
- **globals.css — 4 clases migradas a light:**
  - `.marathon-modal-bg` (blanco + tintes suaves + shadow-modal,
    antes gradiente dark + gold/primary)
  - `.marathon-progress-track` (`bg-bg-muted`)
  - `.marathon-matchup-panel` (`bg-bg-muted + border-default`)
  - `.toast-success` / `.toast-error` (colores dark green/red
    legibles; antes pasteles ilegibles sobre fondo tintado)
- **auth-guard:** `color: "#F5B4B4"` → `text-error`; `"#92A3BA"` →
  `text-text-secondary`.

## Tests
**29/29 pass** en todas las cards. Ninguno tocado. Verificación
visual limitada (auth roto en esta sesión — ver pendientes).

## Grep final de residuos dark mode
```
apps/web/src/components/  → 0 residuos ✅
apps/web/src/app/(public)/page.tsx → 3 residuos (landing pública)
```

## Pendientes para WS37 (C13)

### C13 — QA sub-agente + decisión de merge
1. Pasar QA sub-agente sobre `git diff main` completo de
   `epic/08-ui-redesign-light-mode`.
2. Revisar + commitear working tree actual (no commiteado en WS36).
3. Evaluar si los 3 residuos de la landing pública (`app/(public)/page.tsx`
   L42, L48, L69 con `bg-[rgba(255,255,255,0.04)]`) entran en patch
   menor antes del merge o post-merge.
4. Decisión de merge a `main`.

### Bug reportado por Tomás durante WS36
- **Login roto** (antes funcionaba). No se debuggeo en esta sesión
  porque se priorizó terminar las cards. Revisar en WS37 a nivel
  backend/config antes de cualquier verificación visual end-to-end.

### Tech-debt cosmético pendiente (arrastre)
- `.typo-lead` definido en globals.css sin uso.
- Evaluar eliminar `packages/ui/src/tokens.ts` (ya sin consumidores en
  `apps/web`).
- `.rules-hero-bg` (globals.css L440-444) sigue con gradiente dark;
  usada en `/rules` page. No estaba en scope de las Cs.

## Estado del branch
`epic/08-ui-redesign-light-mode` — último commit `ff29570` (WS35 C1-C6).
WS36 queda con ~11 archivos modificados + 5 archivos nuevos en working
tree, sin commit.

## Gotcha persistente
Turbopack no invalida cambios en `@layer components` de globals.css por
HMR. Workaround: `touch apps/web/src/app/globals.css` fuerza recompile.
Memoria: `memory/feedback_prode_turbopack_css_hmr.md`.

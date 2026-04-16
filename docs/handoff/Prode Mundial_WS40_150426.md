# Prode Mundial — WS40 (FASE 2 · UX/UI Elevation — Kickoff)

**Fecha:** 2026-04-15
**Branch:** `epic/11-ux-fixes-wave-1`
**EPIC:** 11 — UX/UI Elevation (Fase 2)
**Estado:** Wave 0 completada ✅ · plan WS1–WS5 documentado · pendiente arrancar WS1

---

## Objetivo de la sesión

Abrir la FASE 2 del Master Plan (UX Polish). Pasar de "MVP prolijo que funciona en prod" a "producto deportivo premium mobile-first". Estrategia: no ejecutar el plan genérico de 7 bullets de FASE 2, sino consolidar los 3 docs UX escritos por Tomás (v2, v3, v4) con auditoría técnica del código actual, y producir un plan de refactor mayor full-stack.

Decisión de scope: **1F PoC Champions League se pospone al final** (post WS5), para no re-testear sobre una base que va a cambiar fuerte.

---

## Qué se hizo

### 1. Auditorías de estado actual

Tres agentes en paralelo mapearon:

**a) Patrones de notificación / toast** — 3 patrones distintos en uso:
- `.toast-*` (sticky top, auto-dismiss 2.2s) — solo en match-detail
- `.alert-*` (in-flow, persistente) — login, home-states, tournament, macro-picks (×4), match-detail
- `.copy-btn-copied` (feedback inline) — leagues/copy-button

Recomendación: consolidar en `<Toast />` (transient) + `<InlineNotification />` (bloqueante). Cero dependencias nuevas.

**b) Componentes >150 líneas** (candidatos a split):
- `matches-screen.tsx` — 499 líneas
- `match-detail-screen.tsx` — 481
- `marathon-prediction-modal.tsx` — 474
- `macro-picks-screen.tsx` — 460
- `leagues-screen.tsx` — 400
- `tournament-screen.tsx` — 338
- `packages/ui/components.tsx` — **630 líneas (monolito)** → split a 10 archivos
- **Metric duplicado 3×** (leagues/rankings/league-detail) → extraer a UI package
- **64 instancias de `style={{...}}`** sobrevivientes de la migración Tailwind

**c) Docs UX en `docs/product/`** — ya había 5 docs:
- DESIGN_SYSTEM.md (aprobado, pero desactualizado: dice dark-first, el código está en Stadium Light)
- 06. UX Sitemap (aprobado)
- 07. Pre-Tournament UX (parcial)
- 08. Tu Mundial + Marathon (parcial)
- 09. UX Elevation V3 (en progreso, 8 stories STO-UX-011 a 018)

### 2. Consolidación de los 3 docs UX nuevos

Tomás pasó 3 docs binding desde `/Users/tzanchetti/Documents/NewCo - Proyectos/Prode Mundial/`:
- PRODE MUNDIAL - UX Iteration v2
- PRODE MUNDIAL - UX Iteration v3
- PRODE MUNDIAL - UX Iteration v4

**Tesis convergente:** la app se siente "MVP prolijo / dashboard SaaS lavado". Falta alma deportiva, jerarquía brutal, identidad Mundial, densidad mobile real. El producto debe girar con foco total sobre el próximo partido pendiente.

### 3. Wave 0 — 3 fixes inmediatos identificados

**Fix #1 Marathon Lock (backend)** — bug crítico:
- Existía `SCHEDULED_WAITING_WINDOW` que solo abría la ventana de edición 5h antes del kickoff
- Estamos en abril 2026, Mundial en junio → **todos los partidos bloqueados**
- Regla correcta: predicciones abiertas desde siempre, lock solo 1h antes del kickoff

**Fix #2 Nav** — "Tu Mundial" existía en `/tournament` pero no accesible desde bottom-nav:
- Nueva orden: Home · Matches · **Tu Mundial** · Rankings · Leagues
- Profile movido al header (avatar con iniciales, 44×44)

**Fix #3 Imagery** — cero assets del Mundial 2026:
- Pospuesto a WS2 (requiere dirección visual de WS1 + assets que Tomás va a subir manualmente)

### 4. Ejecución Wave 0 (fixes #1 y #2)

Branch: `epic/11-ux-fixes-wave-1`

**Commit `e1c5669` — fix(matches): eliminar ventana de apertura y bloquear edición 1h antes del kickoff**

Archivos tocados:
- `packages/shared/src/constants/matches.ts` — nueva constante `PREDICTION_LOCK_MINUTES_BEFORE_KICKOFF = 60`
- `apps/api/src/domains/matches/services/match-state.ts` — eliminada `SCHEDULED_WAITING_WINDOW` y `hasReachedKickoff`; agregadas `getPredictionDeadlineAt` + `hasReachedPredictionDeadline`; `getPredictionOpensAt` devuelve `match.createdAt` (compat payload)
- `apps/api/src/domains/matches/services/prediction-domain.ts` — eliminada ventana 5h, deadline = kickoff−60min
- `apps/api/src/domains/matches/services/match-payloads.ts` — `deadlineAt` refleja deadline real, quitado branch "Disponible pronto"
- `apps/api/src/domains/tournament/services/pre-tournament-summary-service.ts` — `isPreTournament` basado en kickoff del primer partido
- `apps/jobs/src/domains/match-lock/services/match-lock-enforcement.ts` — `shouldLockMatch` en kickoff−60min
- 6 archivos de tests actualizados

Flags huérfanas (deuda chiquita para WS5 polish):
- `MATCH_PREDICTION_WINDOW_HOURS = 5` ya no la consume nadie
- `PRODE_ENABLE_LAB_PREDICTIONS` ya no tiene efecto

**Commit `99e8b10` — feat(nav): agregar Tu Mundial a bottom-nav y mover Profile al header**

Archivos tocados:
- `packages/shared/src/constants/app.ts` — `MAIN_TABS` sin profile, con tournament en posición 3
- `apps/web/src/components/layout/bottom-nav.tsx` — labels i18n Tu Mundial / Your World Cup
- `apps/web/src/app/(protected)/layout.tsx` — header existente (`ProtectedHeader`) extendido: iniciales del displayName, 36×36 → 44×44, aria-label

**Tests Wave 0:** API 74/74 · Jobs 28/28 · Web 29/29 — todos verdes.

### 5. Smoke test manual (Tomás)

✅ Fix #1 Bottom-nav Tu Mundial — funciona
✅ Fix #2 Profile en header — funciona
❌ Marathon CTAs inconsistentes
❌ Marathon modal fuera de viewport
❌ Marathon modal en color azul oscuro (debería ser Stadium Light)

**Decisión:** no resolver ahora. Registrar como deuda técnica y revisar al cierre de WS5 — probable que se resuelva solo con el refactor de modal (WS3) + tokens (WS1) + split (WS4).

**Commit `7b001f4` — docs(tech-debt): registrar issues pendientes de marathon mode post-fix wave 1**
- `docs/engineering/TECH_DEBT_EPIC_11.md` con los 3 issues + hipótesis + plan de revisión

---

## Plan consolidado FASE 2 — WS1 a WS5

Ver doc completo: `docs/product/FASE_2_UX_UI_ELEVATION_PLAN.md`

**Principio rector:** *"¿Esto hace que la app se sienta más partido-vivo-ahora y menos dashboard-correcto?"*. Si no, no va.

| WS | Foco | Sesiones |
|---|---|---|
| **Wave 0** | 3 fixes inmediatos | ✅ DONE (esta sesión) |
| **WS1** | Foundation visual (tokens, superficies, tipografía, pills, radios, split monolito UI) | 2 |
| **WS2** | Identidad Mundial (imagery genérica + flags + acentos de torneo + empty states) | 1-2 |
| **WS3** | Home hero + prediction flow (modal como joya del producto, score picker táctil) | 2 |
| **WS4** | Scannability (matches, tournament, rankings, leagues) + **backend endpoint `/standings/projected`** | 2-3 |
| **WS5** | Copy cleanup + polish + skeletons + microinteracciones + error states | 1-2 |
| **Total FASE 2** | | **9-12 sesiones** |

**Post FASE 2:** PoC Champions League (beta real con amigos) → FASE 3 Pre-launch (SEO, analytics, push FCM, perf).

---

## Decisiones clave de esta sesión

1. **Pospuesto 1F PoC Champions League** al final del plan — testear con amigos sobre v1 pulida, no sobre base que va a cambiar
2. **Full-stack refactor en Fase 2** — backend (endpoint `/standings/projected`, limpieza de flags huérfanas) va en la misma EPIC que UX
3. **Assets Mundial manuales** — Tomás sube fotos públicas de FIFA/Mundial al repo. Flag legal dado: OK para demo/testing con amigos, review antes de launch público
4. **Stadium Light se mantiene** — descartada la sugerencia del doc v4 de volver a base más oscura; los 3 docs UX se reinterpretan como "más profundidad y contraste dentro de light mode"
5. **Deuda técnica marathon** — no fix inmediato, revisar post-WS5
6. **No mergear a main hasta cerrar EPIC completa** — trabajar toda la Fase 2 en `epic/11-ux-fixes-wave-1` con commits atómicos

---

## Estado del repo al cerrar WS40

- **Branch activa:** `epic/11-ux-fixes-wave-1` (pusheada, sin PR)
- **Commits sobre main:** 3 (`e1c5669` + `99e8b10` + `7b001f4`)
- **Main:** sin cambios desde WS39 (`be7b706`)
- **Producción:** sin cambios (sigue corriendo el código de `main` en Cloud Run + App Hosting)

---

## Próxima sesión (WS41)

**Arrancar WS1 — Foundation visual** con cards atómicas:

- **WS1-C1** — Tokens de superficie (4 niveles: bg / surface / surface-raised / surface-highlight)
- **WS1-C2** — Escala tipográfica disciplinada
- **WS1-C3** — Sistema de pills + status unificado
- **WS1-C4** — Radios + bordes + sombras con jerarquía
- **WS1-C5** — Split `packages/ui/components.tsx` + extraer `Metric` duplicado
- **WS1-C6** — Consolidar 3 patrones de toast → `<Toast />` + `<InlineNotification />`

Mecánica: una card por turno, Tomás confirma con "perf" antes de avanzar, sin build con dev activo, leer solo lo necesario.

---

## Archivos clave creados/modificados

**Creados:**
- `docs/engineering/TECH_DEBT_EPIC_11.md` — deuda marathon
- `docs/handoff/Prode Mundial_WS40_150426.md` — este doc
- `docs/product/FASE_2_UX_UI_ELEVATION_PLAN.md` — plan completo de FASE 2

**Modificados (Wave 0 — 13 archivos + 6 tests):**
- Ver detalles en commits `e1c5669` y `99e8b10`

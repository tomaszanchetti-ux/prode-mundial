# Prode Mundial_WS13_09042026

## Resumen de cierre

Sesion cerrada con un ajuste funcional importante sobre el loop de predicción:

- las predicciones ahora solo se habilitan dentro de una ventana de 5 horas antes del kickoff
- el auto-popup ya no se abre “demasiado pronto”
- `home` y `matches` ahora muestran countdown para la próxima predicción disponible

Esta ventana sí tocó backend + contratos + frontend, pero sin cambiar scoring ni reglas fuera del flujo de predicción.

Adicionalmente:

- se actualizaron tests de `api` y `web`
- commit + push directo a `main`

---

# 1. Objetivo logrado

El producto ahora tiene un loop más “visit-driven”:

- no se puede dejar todo predicho desde demasiado temprano
- la app avisa cuándo se abre la siguiente oportunidad de jugar
- el modal rápido solo aparece cuando de verdad toca actuar

---

# 2. Decisión cerrada

## Regla operativa nueva

- cada partido abre predicción exactamente 5 horas antes del kickoff
- desde ese momento se puede:
  - crear predicción
  - editar predicción
- al kickoff:
  - se bloquea igual que antes

## Implicancia UX

- antes de que abra la ventana:
  - no hay auto-popup
  - se muestra countdown al próximo partido que abrirá

---

# 3. Cambios principales

## Shared

- nuevo valor compartido:
  - `MATCH_PREDICTION_WINDOW_HOURS = 5`
- `MatchSummary` y `MatchDetail` ahora incluyen:
  - `predictionOpensAt`

## Backend

- `match-state` ahora distingue el estado previo a apertura de ventana
- `prediction-domain` rechaza guardado fuera de ventana
- payloads públicos exponen `predictionOpensAt`
- `ctaLabel` ahora puede reflejar estado de disponibilidad próxima

## Frontend

- `home`:
  - si no hay editable activo, muestra “próxima predicción”
  - muestra cuándo abre y cuánto falta
- `matches`:
  - mismo patrón de countdown
- `match detail`:
  - muestra estado `Abre pronto`
  - muestra hora de apertura
- quick modal:
  - solo aparece cuando el partido ya entró en ventana

---

# 4. Archivos principales tocados

## Shared

- `packages/shared/src/constants/matches.ts`
- `packages/shared/src/contracts/matches.ts`
- `packages/shared/src/schemas/matches.ts`

## API

- `apps/api/src/domains/matches/services/match-state.ts`
- `apps/api/src/domains/matches/services/prediction-domain.ts`
- `apps/api/src/domains/matches/services/match-payloads.ts`

## Web

- `apps/web/src/components/home/home-screen.tsx`
- `apps/web/src/components/matches/matches-screen.tsx`
- `apps/web/src/components/matches/match-detail-screen.tsx`

## Tests

- tests de `api` para:
  - ventana no abierta
  - escritura dentro de ventana
  - payloads con `predictionOpensAt`
- tests de `web` ajustados al nuevo estado `Abre pronto`

---

# 5. Validaciones ejecutadas

- `corepack pnpm --filter @prode/shared build`
- `corepack pnpm --filter @prode/api typecheck`
- `corepack pnpm --filter @prode/api test`
- `corepack pnpm --filter @prode/web typecheck`
- `corepack pnpm --filter @prode/web test`

Todas OK al cierre.

---

# 6. Estado Git

- branch de trabajo / publicación:
  - `main`
- commit publicado:
  - `fe0f499` -> `feat: gate predictions behind a 5 hour window`
- estado remoto:
  - `origin/main` actualizado

Nota:

- quedó sin publicar el cambio local de `apps/web/next-env.d.ts` porque era ruido generado por `next dev`

---

# 7. Próximo paso recomendado

Volver a core funcional:

1. entrar a `Epic 3 — Scoring, Points & League Standings`
2. aprovechar que:
   - la capa visual ya quedó fuerte
   - el loop de predicción ya quedó endurecido
   - la próxima gran pieza de valor es puntos + standings

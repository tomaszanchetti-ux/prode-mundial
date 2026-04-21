# Prode Mundial_WS7_09042026

## Resumen de la sesión

Sesion enfocada en dos cortes consecutivos de `Epic 2`:

1. commit formal de `CARD 0`
2. implementacion completa de `CARD 1 — Shared Domain Contracts for Matches & Predictions`

---

# 1. Que se hizo

## Commit de `CARD 0`

- se hizo commit del arranque visual de `Epic 2` en:
  - `62ec4dc` -> `feat: start epic 2 ui foundation`

## Implementacion de `CARD 1`

Se completo la capa shared de contratos para matches y predictions en `packages/shared`.

Archivos agregados:

- `packages/shared/src/constants/matches.ts`
- `packages/shared/src/contracts/matches.ts`
- `packages/shared/src/schemas/matches.ts`

Archivos actualizados:

- `packages/shared/src/index.ts`
- `packages/shared/src/types/api.ts`

## Contratos agregados

Quedaron definidos:

- `MatchStage`
- `MatchStatus`
- `PredictionStatus`
- `MatchListFilter`
- `TeamRef`
- `MatchSummary`
- `MatchOfficialResult`
- `MatchPredictionScoringBreakdown`
- `UserMatchPrediction`
- `MatchScoringRules`
- `MatchDetail`
- `ListMatchesQuery`
- `ListMatchesResponse`
- `SaveMatchPredictionInput`
- `SaveMatchPredictionResponse`

## Schemas agregados

Quedaron definidos los schemas compartidos para:

- `teamRef`
- `matchStage`
- `matchStatus`
- `predictionStatus`
- `matchListFilter`
- `matchSummary`
- `matchOfficialResult`
- `matchPredictionScoringBreakdown`
- `userMatchPrediction`
- `matchScoringRules`
- `matchDetail`
- `listMatchesQuery`
- `listMatchesResponse`
- `saveMatchPredictionInput`
- `saveKnockoutMatchPredictionInput`
- `saveMatchPredictionResponse`

## Reglas publicas y errores

- se agregaron constantes compartidas para:
  - stages
  - match statuses
  - prediction statuses
  - filtros de listado
  - scoring rules MVP
  - errores publicos de prediccion de partido
- `ApiErrorCode` ahora contempla errores cerrados por la API spec de `Epic 2`

Nota importante:

- la regla knockout `empate => classifier obligatorio` se dejo como schema contextual separado (`saveKnockoutMatchPredictionInputSchema`) porque depende del tipo de partido, no solo del payload base

---

# 2. Validaciones ejecutadas

- `./pnpm --filter @prode/shared typecheck`
- `./pnpm --filter @prode/shared build`
- `./pnpm --filter @prode/web typecheck`

Todas OK al cierre.

---

# 3. Estado resultante

## Branch activa al cierre

- `epic/epic-2-fixtures-match-predictions`

## Working tree

Quedan cambios sin commitear de `CARD 1` en:

- `packages/shared/src/index.ts`
- `packages/shared/src/types/api.ts`
- `packages/shared/src/constants/matches.ts`
- `packages/shared/src/contracts/matches.ts`
- `packages/shared/src/schemas/matches.ts`
- `docs/handoff/PROJECT_MEMORY.md`
- este handoff `WS7`

---

# 4. Proximo paso recomendado

El siguiente corte natural es:

1. commitear `CARD 1`
2. arrancar `CARD 2 — Base Data Seeding for Teams, Groups & Matches`
3. seguir con `CARD 3 — Matches Repository & Query Layer`

La razon es simple:

- ya existe base visual (`CARD 0`)
- ya existe contrato shared (`CARD 1`)
- ahora falta el dataset y la capa backend que convierta esos contratos en flujo real

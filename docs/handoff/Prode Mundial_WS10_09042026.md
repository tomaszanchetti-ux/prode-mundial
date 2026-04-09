# Prode Mundial_WS10_09042026

## Resumen de cierre

Sesion cerrada con avance material de `Epic 2` sobre backend y datos reales del flujo de partidos.

En esta ventana quedaron cerradas:

- `CARD 2`
- `CARD 3`
- `CARD 4`
- `CARD 5`
- `CARD 6`
- `CARD 7`

---

# 1. Estado funcional alcanzado

## CARD 2

- seed reproducible de:
  - `teams`
  - `groups`
  - `matches`
- script operativo agregado:
  - `./pnpm --filter @prode/api seed:wc2026 -- --dry-run`
  - `./pnpm --filter @prode/api seed:wc2026`
- mezcla dev util de estados:
  - `scheduled`
  - `live`
  - `finished`

## CARD 3

- repositorios de lectura creados para:
  - `matches`
  - `predictions`
  - `teams`
- servicio `matchesQueryService` ya resuelve payload UX-ready para:
  - listado
  - detalle
- se consolidaron derivaciones backend:
  - `isLocked`
  - `isEditable`
  - `requiresQualifierIfDraw`
  - `predictionStatus`
  - `userPredictionSummary`
  - `ctaLabel`

## CARD 4

- endpoint autenticado listo:
  - `GET /api/v1/matches`
- query params ya validados:
  - `stage`
  - `filter`
  - `cursor`
  - `limit`

## CARD 5

- endpoint autenticado listo:
  - `GET /api/v1/matches/:matchId`
- detalle ya devuelve:
  - `officialResult`
  - `userPrediction`
  - `scoringRules`
  - `requiresQualifierIfDraw`

## CARD 6

- reglas de dominio implementadas para predicciones:
  - score valido
  - knockout draw => clasificado obligatorio
  - clasificado valido dentro del partido
  - bloqueo por kickoff
  - ownership guard

## CARD 7

- persistencia de `predictions` cerrada con estrategia de upsert por:
  - `userId + matchId`
- create y update ya reutilizan helpers puros para mantener shape canonica

---

# 2. Validaciones ejecutadas

- `./pnpm --filter @prode/api typecheck`
- `./pnpm --filter @prode/api test`
- `./pnpm --filter @prode/api seed:wc2026 -- --dry-run`

Todas OK al cierre.

---

# 3. Estado de la branch

- branch activa: `epic/epic-2-fixtures-match-predictions`
- esta sesion debe cerrarse con:
  - commit
  - push
- no se mergeo a `main`

---

# 4. Proximo paso recomendado

Entrar directo a:

1. `CARD 8 — PUT /api/v1/matches/:matchId/prediction`
2. conectar:
   - `matchesRepository.getMatchById`
   - `validatePredictionInput`
   - `predictionsRepository.upsertPrediction`
3. cubrir errores de dominio:
   - `MATCH_LOCKED`
   - `INVALID_SCORE`
   - `INVALID_KNOCKOUT_CLASSIFIER`
4. despues avanzar con `CARD 9`

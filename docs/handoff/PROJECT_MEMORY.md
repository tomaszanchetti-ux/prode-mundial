# Prode Mundial - PROJECT_MEMORY.md

## Propósito

Memoria viva del proyecto para continuidad entre sesiones.

Debe reflejar:

- estado actual real
- decisiones cerradas
- límites del MVP
- estado del repo
- próximos focos de ejecución

---

# Estado actual

## Base operativa

- repo principal: `/Users/tzanchetti/Documents/Proyectos Claudio/prode-mundial`
- documentación principal migrada a `docs/product`, `docs/engineering` y `docs/backlog`
- `AGENTS.md` y `ATOMIC_TASKING_GUIDE.md` vigentes en raíz

## Estado documental

El corpus quedó alineado para implementación con estas decisiones rectoras:

- MVP sin ranking global
- ligas operativas solo con capacidad de 20 miembros
- planes pagos, checkout, billing runtime y branding premium quedan post-MVP / v1
- backend como source of truth
- contracts-first
- scoring batch/event-driven
- design system UI oficial ya incorporado al repo como guía binding para frontend y `packages/ui`

## Estado técnico

Se creó el bootstrap inicial del monorepo:

- `apps/web`
- `apps/api`
- `apps/jobs`
- `apps/admin`
- `packages/shared`
- `packages/ui`
- `packages/config`
- `packages/testing`

Validaciones ejecutadas:

- install OK
- typecheck OK
- build OK
- test OK
- typecheck global OK también luego del cierre pendiente de `Epic 1`
- build global OK también luego del fallback controlado en landing pública
- test global OK con casos reales agregados en `web` y `api`
- `Epic 2 / CARD 0` ya iniciada sobre branch dedicada con base visual dark-first en `packages/ui`

Avance adicional de `Epic 1`:

- contratos compartidos alineados con API spec para `public/bootstrap` y `me`
- `apps/api` ya expone `GET /api/v1/public/bootstrap`, `GET /api/v1/me` y `PATCH /api/v1/me`
- validación uniforme de payloads y envelope estándar reutilizable
- validación real de Firebase ID token en API vía `firebase-admin`
- persistencia de perfiles autenticados en Firestore sobre colección `users`
- carga explícita de `.env` raíz en API y `.env.local` en web para desarrollo local real
- CORS local resuelto para `http://localhost:3000 -> http://localhost:4000`
- `apps/web` ya muestra:
  - landing pública alineada al sitemap
  - pantalla `/login` conectada a Google + magic link
  - shell autenticado con tabs `home`, `matches`, `rankings`, `leagues`, `profile`
  - guards de sesión cliente con redirect a `/login`
  - redirect de perfil incompleto hacia `/profile`
  - pantalla de perfil conectada a sesión Firebase real con logout
- endurecimiento final de `Epic 1`:
  - mensajes UX más claros para popup cancelado, popup bloqueado, magic link inválido/expirado y sesión inválida
  - expiración/invalidez de token `401` ya fuerza retorno limpio a estado no autenticado
  - landing pública con fallback local a `DEFAULT_PUBLIC_BOOTSTRAP` si la API no responde
  - tests mínimos reales agregados para:
    - auth guard decision logic
    - login view render base
    - rechazo `401` de API sin bearer / token inválido
- estado Git actual:
  - branch activa: `epic/epic-2-fixtures-match-predictions`
  - auth real ya validada localmente sobre Firebase del proyecto `prode-mundial-4e419`
  - `Epic 1` quedó cerrada y publicada en:
    - `origin/epic/epic-1-foundation-auth-shell`
    - `origin/main`
  - commit base estable actual: `c6aa2a1`
  - avance actual de `Epic 2` ya consolidado en commits locales:
    - `62ec4dc` -> `feat: start epic 2 ui foundation`
    - `1fa38ab` -> `feat: add shared match contracts`
    - `e99ea09` -> `docs: close epic 2 session handoff`
  - working tree con avance local material sobre `CARD 2` a `CARD 7` antes del siguiente commit de cierre

## Avance inicial de Epic 2

- se creo la branch `epic/epic-2-fixtures-match-predictions` desde `main`
- `packages/ui` ahora expone:
  - tokens compartidos de color, spacing, radios, tipografia y superficies
  - `Button`
  - `Card`
  - `StatusTag`
  - `TeamDisplay`
  - `MatchCard`
  - `ScoreInput`
  - `PredictionModal`
- `apps/web` ya consume la nueva base visual en:
  - layout raiz dark-first
  - shell autenticado
  - `BottomNav`
  - `Home`
  - `Matches`
- `/matches` ya dejo de ser un placeholder simple y ahora funciona como demo visual de `CARD 0` con:
  - estados `editable`, `locked` y `scored`
  - CTAs contextuales
  - ejemplo visible de `PredictionModal`
  - ejemplo visible de `ScoreInput` con selector de clasificado para knockout

Validaciones ejecutadas para este avance:

- `./pnpm --filter @prode/ui typecheck`
- `./pnpm --filter @prode/ui build`
- `./pnpm --filter @prode/web typecheck`

## Avance de CARD 1

- `packages/shared` ya define contratos publicos de matches y predictions en:
  - `constants/matches`
  - `contracts/matches`
  - `schemas/matches`
- se agregaron y exportaron:
  - `MatchStage`
  - `MatchStatus`
  - `PredictionStatus`
  - `TeamRef`
  - `MatchSummary`
  - `MatchDetail`
  - `UserMatchPrediction`
  - `ListMatchesQuery`
  - `ListMatchesResponse`
  - `SaveMatchPredictionInput`
  - `SaveMatchPredictionResponse`
- se agregaron schemas compartidos para:
  - query de listado
  - summary de partido
  - detail de partido
  - payload de guardado
  - respuesta de guardado
  - variante contextual para knockout con empate
- `ApiErrorCode` ya incluye errores publicos de `Epic 2`:
  - `MATCH_LOCKED`
  - `MATCH_NOT_FOUND`
  - `MATCH_NOT_EDITABLE`
  - `INVALID_SCORE`
  - `INVALID_KNOCKOUT_CLASSIFIER`

Validaciones ejecutadas para este avance:

- `./pnpm --filter @prode/shared typecheck`
- `./pnpm --filter @prode/shared build`
- `./pnpm --filter @prode/web typecheck`

## Alineacion al fixture real FIFA 2026

- el proyecto ya no asume el formato viejo de 32 selecciones
- contratos y documentacion binding ahora contemplan:
  - 48 equipos
  - 12 grupos
  - `R32`
  - `R16`
  - `QF`
  - `SF`
  - `BRONZE`
  - `FINAL`
- la ventana de ajuste macro y sus deadlines se reinterpretaron como:
  - cierre al kickoff del primer partido knockout
  - ya no al kickoff del primer partido de octavos
- `packages/shared` ahora expone `MATCH_STAGES` alineado al fixture real FIFA 2026

## Base oficial para CARD 2

- se agrego fuente oficial reproducible FIFA 2026 en:
  - `apps/api/src/domains/matches/data/world-cup-2026.ts`
- se agrego extractor crudo del PDF oficial FIFA en:
  - `scripts/extract_fifa_world_cup_2026_schedule.py`
- se agrego normalizador de fixture a dataset seed-ready en:
  - `scripts/normalize_fifa_world_cup_2026_schedule.py`
- se genero dataset crudo agrupado por numero oficial de partido:
  - `apps/api/src/domains/matches/data/world-cup-2026-raw-schedule.json`
- se genero dataset normalizado inicial de 104 partidos con:
  - `officialMatchNumber`
  - `stage`
  - `groupId`
  - `homeTeamId` / `awayTeamId` para fase de grupos
  - `homeSlot` / `awaySlot` para knockout
  - `kickoffAtEt`
  - `kickoffAtUtc`
  - `venueId`
  - `status`
  - `isLocked`
  - `isScored`
  - archivo:
    - `apps/api/src/domains/matches/data/world-cup-2026-normalized-matches.json`

Validaciones ejecutadas para esta alineacion:

- `./pnpm --filter @prode/shared build`
- `./pnpm --filter @prode/api typecheck`

## Cierre de CARD 2

- `apps/api` ya tiene seed reproducible para:
  - `teams`
  - `groups`
  - `matches`
- se agrego script operativo:
  - `./pnpm --filter @prode/api seed:wc2026 -- --dry-run`
  - `./pnpm --filter @prode/api seed:wc2026`
- el seed:
  - reutiliza el fixture FIFA 2026 normalizado
  - persiste metadata util para backend futuro:
    - `officialMatchNumber`
    - `venueId`
    - `homeSlot`
    - `awaySlot`
    - `kickoffAtEt`
  - deja mezcla de estados dev utiles:
    - `scheduled`
    - `live`
    - `finished`
- documentacion actualizada en:
  - `README.md`
  - `apps/api/src/domains/matches/README.md`

Validaciones ejecutadas para este cierre:

- `./pnpm --filter @prode/api typecheck`
- `./pnpm --filter @prode/api seed:wc2026 -- --dry-run`

## Cierre de CARD 3

- se creo capa backend de lectura desacoplada de HTTP para `matches`
- nuevos repositorios:
  - `matchesRepository`
  - `predictionsRepository`
  - `teamsRepository`
- nuevo servicio de query:
  - `matchesQueryService`
- nuevas derivaciones backend resueltas server-side:
  - `isLocked`
  - `isEditable`
  - `requiresQualifierIfDraw`
  - `predictionStatus`
  - `userPredictionSummary`
  - `ctaLabel`
- knockout no resuelto aun se representa con placeholders por slot:
  - ejemplo: `Por definir (2A)`

Validaciones ejecutadas:

- `./pnpm --filter @prode/api typecheck`
- `./pnpm --filter @prode/api test`

## Cierre de CARD 4

- `apps/api` ya expone endpoint autenticado:
  - `GET /api/v1/matches`
- el endpoint:
  - valida `stage`
  - valida `filter`
  - valida `cursor`
  - valida `limit`
  - delega al `matchesQueryService`
- se agregaron tests de integracion para:
  - auth
  - forwarding correcto de query params
  - `VALIDATION_ERROR` en query invalida

## Cierre de CARD 5

- `apps/api` ya expone endpoint autenticado:
  - `GET /api/v1/matches/:matchId`
- el endpoint devuelve:
  - payload completo de detalle
  - `requiresQualifierIfDraw`
  - `officialResult`
  - `userPrediction`
  - `scoringRules`
- se agregaron tests de integracion para:
  - caso feliz
  - `MATCH_NOT_FOUND`

## Cierre de CARD 6

- se implemento capa pura de reglas de dominio para predicciones:
  - `validatePredictionInput`
  - `assertMatchPredictionEditable`
  - `assertPredictionOwnership`
- reglas cubiertas:
  - score entero y `>= 0`
  - knockout draw => clasificado obligatorio
  - clasificado debe pertenecer al partido
  - si no hay empate, clasificado se limpia a `null`
  - `now < kickoffAt`

## Cierre de CARD 7

- `predictionsRepository` ya soporta:
  - `upsertPrediction(userId, matchId, input)`
- estrategia aplicada:
  - lookup por `userId + matchId`
  - update si existe
  - create si no existe
- persistencia alineada a modelo con:
  - `predictionId`
  - `userId`
  - `matchId`
  - `homeScorePred`
  - `awayScorePred`
  - `predictedQualifierTeamId`
  - `predictedWinnerTeamId`
  - `isLocked`
  - `isScored`
  - `pointsAwarded`
  - `createdAt`
  - `updatedAt`
- helper puro agregado para construir y mergear entidad persistida:
  - `prediction-persistence.ts`

## Tooling relevante

- Node disponible
- `pnpm` usable vía `corepack pnpm`
- existe wrapper local `./pnpm` para compatibilidad con `turbo`
- `tsx` agregado en raíz para ejecutar tests `ts/tsx` reales en `web` y `api`

---

# Decisiones cerradas

- usar monorepo con `pnpm` + `turbo`
- `apps/web` en Next.js
- `apps/api` en Node + Express + TypeScript
- `packages/shared` como fuente de contratos públicos
- `Epic 1` es la primera épica de implementación real
- flujo Git operativo del proyecto:
  - branch dedicada por épica
  - trabajo card por card en local
  - commit + push al cierre de cada sesión con avance material
  - sin PRs mientras el proyecto lo operemos nosotros mismos
  - merge a `main` al cerrar la épica y luego de QA

---

# Fuera de alcance actual

- ranking global
- checkout
- billing runtime
- planes pagos operativos
- branding premium de ligas
- logo upload
- upgrades de plan

---

# Próximo foco recomendado

Con `CARD 2` a `CARD 7` ya cerradas, el siguiente corte natural dentro de `Epic 2` es terminar el loop jugable de guardado de predicciones.

Orden recomendado:

1. implementar `CARD 8 — PUT /api/v1/matches/:matchId/prediction`
2. reutilizar:
   - `matchesRepository.getMatchById`
   - `validatePredictionInput`
   - `predictionsRepository.upsertPrediction`
3. validar:
   - `MATCH_LOCKED`
   - `INVALID_SCORE`
   - `INVALID_KNOCKOUT_CLASSIFIER`
4. luego seguir con `CARD 9 — Match Locking Rules & Derived States`

---

# Regla de mantenimiento

Actualizar este documento al cierre de cada sesión relevante.

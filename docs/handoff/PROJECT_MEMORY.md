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

Actualización relevante post `Epic 2`:

- se cerró una iteración fuerte de UX/UI sobre la app web del MVP ya montada sobre la base funcional existente
- el rediseño NO cambió reglas de producto ni contratos críticos; reordenó jerarquía visual, copy y velocidad de acción
- la experiencia ahora prioriza explícitamente:
  - próximo partido pendiente
  - acción rápida desde `home`
  - modal de predicción como camino rápido
  - navegación y tono visual más cercanos a producto deportivo que a shell técnica

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
  - branch activa al cierre actual: `main`
  - auth real ya validada localmente sobre Firebase del proyecto `prode-mundial-4e419`
  - `Epic 1` quedó cerrada y publicada en:
    - `origin/epic/epic-1-foundation-auth-shell`
    - `origin/main`
  - commit base estable actual: `c6aa2a1`
  - arranque de `Epic 2` consolidado originalmente en commits:
    - `62ec4dc` -> `feat: start epic 2 ui foundation`
    - `1fa38ab` -> `feat: add shared match contracts`
    - `e99ea09` -> `docs: close epic 2 session handoff`
  - cierre de `Epic 2` ya publicado en:
    - `2477e0d` -> `feat: close epic 2 core matches flow`
    - `2bbefe0` -> `chore: automate local world cup bootstrap`
    - `e2cf220` -> `merge: close epic 2 core matches flow`
  - iteración UX/UI publicada luego en:
    - `a28b925` -> `feat: redesign core ux and ui flows`
  - working tree actual:
    - cambios locales solo en handoff / memoria de sesión hasta cerrar documentación

## Iteración UX/UI cerrada sobre Web

- `packages/ui` fue re-trabajado para alinear el sistema visual a un dark sports feel más claro y deseable
- cambios principales en sistema visual:
  - `primary` azul
  - rojo reservado para error / alerta real
  - superficies menos pesadas
  - mejor jerarquía tipográfica
  - pills y CTAs más consistentes
- componentes compartidos refinados:
  - `Button`
  - `Card`
  - `StatusTag`
  - `TeamDisplay`
  - `MatchCard`
  - `ScoreInput`
  - `PredictionModal`

## Estado actual de la Web

- shell autenticado ya no comunica staging / MVP interno
- `BottomNav` ya fue refinada y `Rankings` pasó a leerse como `Posiciones`
- `Home` ya fue transformada en pantalla de acción:
  - hero corto
  - priority card del próximo partido
  - resumen de actividad
  - acceso rápido a modal de predicción
- `Matches` ya fue rejerarquizada:
  - header más compacto
  - filtros más claros
  - cards más deportivas y escaneables
  - quick prediction disponible desde la lista
- `Match Detail` ya fue rediseñada:
  - header más liviano
  - bloque compacto de scoring / deadline
  - score selector más protagonista
- `Landing` y `Login` ya quedaron alineadas al nuevo tono visual
- `Profile`, `Rules`, `Terms` y `Privacy` ya no muestran copy técnico / placeholder de implementación

## Comportamientos UX nuevos ya vivos

- `home` abre el modal del próximo partido editable cuando corresponde
- `matches` también puede abrir el quick flow del próximo pendiente
- existe componente reusable:
  - `apps/web/src/components/matches/quick-prediction-modal.tsx`
- la lógica actual prioriza:
  - partido editable sin predicción
  - si no existe, siguiente editable con predicción guardada

## Validaciones recientes

- `corepack pnpm --filter @prode/ui typecheck`
- `corepack pnpm --filter @prode/web typecheck`
- `corepack pnpm --filter @prode/web test`

Todas OK al cierre de la iteración UX/UI.

## Próximo foco recomendado

- si el objetivo vuelve a core funcional:
  - entrar a `Epic 3 — Scoring, Points & League Standings`
- si se quiere una pasada final de polish frontend:
  - revisar microinteracciones / motion fina
  - QA responsive manual en mobile real
  - decidir si el auto-open del modal también debe dispararse inmediatamente post-login

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

## Cierre de CARD 8 a CARD 10

- `apps/api` ya expone endpoint autenticado:
  - `PUT /api/v1/matches/:matchId/prediction`
- el endpoint:
  - busca partido
  - valida payload match-level
  - aplica reglas de kickoff / knockout
  - hace upsert idempotente
  - devuelve `SaveMatchPredictionResponse`
- se agrego capa explícita de estado derivado para matches y predictions:
  - `match-state.ts`
  - `matchState`
  - `predictionLifecycleState`
  - `isEditable`
  - `isLocked`
  - `isFinished`
  - `isScored`
- `packages/shared` y payloads publicos ya exponen:
  - `isFinished`
  - `isScored`
- `apps/jobs` ya tiene job operativo mínimo para:
  - `Match Lock Enforcement`
  - lock de partidos vencidos
  - lock de predicciones asociadas

Validaciones ejecutadas:

- `corepack pnpm --filter @prode/api typecheck`
- `corepack pnpm --filter @prode/api test`
- `corepack pnpm --filter @prode/jobs typecheck`
- `corepack pnpm --filter @prode/jobs build`
- `corepack pnpm --filter @prode/jobs test`

## Cierre de CARD 11 a CARD 14

- `packages/ui` ya recibió refresh visual dark-first más alineado al tono del Mundial:
  - azul noche / petróleo
  - rojo cálido como primario
  - dorado suave como acento
  - verde reservado a success
- `/matches` ya dejó de ser demo estática y ahora consume backend real:
  - `GET /api/v1/matches`
  - filtros por fase / estado
  - loading / empty / error state
  - CTA contextual backend-driven
- se agregó ruta dinámica:
  - `/matches/[matchId]`
- el detalle de partido ya soporta:
  - `GET /api/v1/matches/:matchId`
  - `PUT /api/v1/matches/:matchId/prediction`
  - selector condicional de clasificado
  - feedback de guardado
  - retry simple
  - estado bloqueado
  - bloque de resultado / puntos
- `apps/web` ya tiene tests UI mínimos para:
  - listado de partidos
  - CTA contextual
  - empty state
  - selector de clasificado
  - toast de guardado
  - retry de guardado
  - estado bloqueado

Validaciones ejecutadas:

- `corepack pnpm --filter @prode/ui build`
- `corepack pnpm --filter @prode/web typecheck`
- `corepack pnpm --filter @prode/web test`
- `corepack pnpm --filter @prode/api test`

## DX local / bootstrap de datos

- se agregó flujo idempotente para asegurar datos base del torneo en local:
  - `./pnpm --filter @prode/api ensure:wc2026`
- el script:
  - verifica si existen `teams`, `groups` y `matches`
  - ejecuta seed solo si faltan
  - hace `skip` si Firestore ya está poblado
- se agregó comando raíz:
  - `pnpm dev:setup`
- flujo recomendado actual para desarrollo:
  1. `corepack enable`
  2. `corepack prepare pnpm@10.18.3 --activate`
  3. `pnpm install`
  4. `pnpm dev:setup`
- criterio operativo acordado:
  - local: asegurar bootstrap automáticamente antes del arranque
  - producción: bootstrap inicial controlado del torneo, no autoseed silencioso en runtime

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

`Epic 2` quedó cerrada, mergeada a `main` y validada manualmente en entorno local con backend real y Firestore poblado.

El siguiente corte natural del proyecto es entrar a `Epic 3 — Scoring, Points & League Standings`.

Orden recomendado:

1. definir el primer slice ejecutable de scoring match-level
2. puntuar predicciones sobre partidos `finished` y `isScored = false`
3. persistir `pointsAwarded` + `scoringBreakdown`
4. actualizar acumulados de usuario
5. recién después entrar a standings de ligas

---

# Regla de mantenimiento

Actualizar este documento al cierre de cada sesión relevante.

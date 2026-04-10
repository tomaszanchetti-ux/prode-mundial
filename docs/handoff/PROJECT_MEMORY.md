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

Actualización documental nueva:

- se incorporó una nueva capa de producto para el período pre-torneo
- esta capa introduce:
  - `Pre-Tournament Mode`
  - `Marathon Mode`
  - `Tu Mundial`
- se decidió explícitamente que:
  - esta capa entra antes de `Epic 4`
  - `Mundial Real` queda diferido a una etapa asociada a ingestión real

Actualización operativa nueva:

- el proyecto ahora adopta una estrategia oficial de testing en 3 fases
- el orden quedó cerrado como regla de trabajo:
  - `Testing 1 - UX/UI`
  - `Testing 2 - Logica Cerrada`
  - `Testing 3 - Logica Abierta`
- esto quedó documentado como referencia binding en:
  - `docs/engineering/Prode Mundial - TESTING STRATEGY.md`

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

## Cambio funcional reciente sobre predicción

- se cerró una nueva regla operativa de producto para mejorar retorno y frecuencia de visitas
- las predicciones ya NO quedan abiertas desde cualquier momento previo al partido
- nueva regla:
  - la ventana abre solo 5 horas antes del kickoff
  - durante esa ventana el usuario puede crear y editar libremente
  - al llegar el kickoff, se bloquea como antes
- esta regla ya quedó bajada a:
  - backend de estados derivados
  - validación de escritura de predicción
  - contratos compartidos
  - UI de `home`, `matches` y `match detail`

## Estado actual de apertura de ventana

- `packages/shared` ahora expone:
  - `MATCH_PREDICTION_WINDOW_HOURS = 5`
- `MatchSummary` / `MatchDetail` ahora incluyen:
  - `predictionOpensAt`
- backend:
  - `isEditable` solo pasa a `true` cuando `now >= predictionOpensAt`
  - antes de eso el partido queda en estado de espera de ventana
- escritura:
  - `PUT /api/v1/matches/:matchId/prediction` rechaza fuera de la ventana con `MATCH_LOCKED`

## UX actual asociada a la ventana

- auto-popup:
  - solo abre si el próximo partido ya está dentro de la ventana de predicción
- `home`:
  - si no hay partido editable aún, muestra cuál es la próxima predicción que abre
  - muestra cuándo abre y cuánto falta
- `matches`:
  - también expone el próximo partido cuya ventana va a abrir
- `match detail`:
  - comunica explícitamente si el partido todavía está en `Abre pronto`
  - muestra la hora de apertura de la predicción

## Validaciones recientes

- `corepack pnpm --filter @prode/ui typecheck`
- `corepack pnpm --filter @prode/web typecheck`
- `corepack pnpm --filter @prode/web test`
- `corepack pnpm --filter @prode/shared build`
- `corepack pnpm --filter @prode/api typecheck`
- `corepack pnpm --filter @prode/api test`

Todas OK al cierre de la iteración UX/UI + ventana de predicción.

## Estado funcional real al cierre actual

- `Epic 1` cerrada
- `Epic 2` cerrada
- `Epic 3` con primera capa funcional ya cerrada en repo:
  - puntos por usuario
  - standings materializados
  - `GET /api/v1/points`
  - `GET /api/v1/leagues`
  - `GET /api/v1/leagues/:leagueId/standings`
- `Epic 4` todavía NO iniciada como siguiente bloque de ejecución

## Nuevo foco recomendado

Antes de `Epic 4`, el proyecto debe ejecutar una nueva épica intermedia:

- `Epic 3.5 — Pre-Tournament Mode, Tu Mundial & Marathon Mode`

Razón:

- redefine el loop visible principal antes del inicio del Mundial
- cambia la prioridad de `home`
- introduce progreso global de grupos
- introduce el flujo secuencial de completitud
- introduce `Tu Mundial` como superficie de engagement alto valor

## Estado actual de Epic 3.5

La base principal de `Epic 3.5` ya quedó implementada en repo:

- contratos shared de torneo/pre-torneo
- endpoint `GET /api/v1/me/pre-tournament`
- endpoint `GET /api/v1/me/tournament`
- `Home` con modo pre-torneo
- `Marathon Mode`
- `Tu Mundial`
- transición explícita a modo live

También quedó agregada una capa de laboratorio para `Testing 1 - UX/UI`:

- backend:
  - `PRODE_ENABLE_LAB_PREDICTIONS`
- frontend:
  - `NEXT_PUBLIC_ENABLE_LAB_PREDICTIONS`

Objetivo:

- permitir testing local UX/UI sin depender todavía de la ventana real de predicción de 5 horas

## Estado actual de testing

La estrategia binding de testing en 3 fases ya quedó incorporada al proyecto.

Orden obligatorio:

1. `Testing 1 - UX/UI`
2. `Testing 2 - Lógica Cerrada`
3. `Testing 3 - Lógica Abierta`

Estado real al cierre actual:

- `Testing 1` iniciado
- varios bugs de flujo ya corregidos durante la pasada manual
- queda pendiente revalidar manualmente el flujo:
  - `Home -> Seguir completando -> Marathon -> guardar -> autoavance`

La limitación actual no es de código crítico confirmado sino de entorno local:

- el `dev` completo con seed/demo está presionando memoria de la máquina durante la pasada manual

## Próximo foco recomendado

La próxima ventana debería:

1. retomar `Testing 1 - UX/UI` desde el flujo de `Home -> Marathon`
2. cerrar los hallazgos UX/UI restantes de `Epic 3.5`
3. recién después abrir el frente `Champions` como slice técnico controlado para `Testing 2/3`

## Marco actual de testing

- primero conviene cerrar una fase de testing UX/UI muy exhaustiva en local
- esta fase puede usar data dummy, seeds controlados y estados preparados para recorrer la app completa modo por modo
- recién después conviene endurecer la lógica real en un entorno cerrado
- la siguiente semana ya se considera deseable apuntar a una prueba controlada con Champions League como caso puente de lógica abierta / fetch externo, siempre que las fases previas estén suficientemente maduras

## Implicancia práctica inmediata

`Epic 3.5` debe ejecutarse bajo este criterio:

1. cerrar experiencia de `Pre-Tournament Mode`
2. cerrar experiencia de `Marathon Mode`
3. cerrar experiencia de `Tu Mundial`
4. endurecer luego la lógica final que corresponda
5. preparar después el frente de validación abierta controlada

## Orden recomendado actualizado

1. cerrar documentación ejecutable de `Epic 3.5`
2. implementar `Epic 3.5`
3. retomar `Epic 4`
4. dejar `Mundial Real` para una etapa posterior ligada a ingestión real

## Documentos nuevos binding para continuidad

- `docs/product/07. Prode Mundial - Pre-Tournament UX Mode + Dynamic Standings Spec.md`
- `docs/product/08. Prode Mundial - Tu Mundial, Mundial Real + Marathon Mode UX Spec.md`
- `docs/backlog/EPIC 3.5 — Pre-Tournament Mode, Tu Mundial & Marathon Mode.md`

## Workflow operativo de datos locales

Se cerró una decisión operativa importante para las siguientes sesiones:

- durante desarrollo del core competitivo se trabaja con dos capas de datos
- estas capas pueden convivir temporalmente en el mismo proyecto Firebase local

### Capa 1 — Base real del torneo

Debe representar la estructura estable del Mundial:

- `teams`
- `groups`
- `matches`

Esta base puede sembrarse con el fixture normalizado oficial y mantenerse relativamente estable para DX.

### Capa 2 — Demo competitiva temporal

Debe representar un escenario controlado para probar engagement y competencia:

- `leagues`
- `leagueMembers`
- `leagueStandings`
- usuarios demo
- predicciones demo
- partidos demo y/o scoring demo

Su objetivo no es representar la fuente real, sino permitir validación rápida y repetible de:

- ligas
- resultados
- scoring
- puntos
- rankings
- estados de UI

### Regla de ejecución acordada

- la demo competitiva NO debe correr automáticamente en cada `pnpm dev`
- la demo competitiva sí debe poder sembrarse explícitamente cuando haga falta
- la base real y la demo pueden convivir temporalmente
- más adelante debe existir una forma explícita de resetear solo la capa demo

### Script actual disponible

Ya existe:

- `pnpm --filter @prode/api seed:competition-demo`
- `pnpm --filter @prode/api reset:competition-demo`
- `pnpm --filter @prode/api fresh:competition-demo`

Este script actualmente:

- toma como usuario ancla uno real existente en `users` si lo encuentra
- si no existe, crea un usuario demo base
- crea ligas demo
- crea memberships demo
- crea partidos demo desacoplados del fixture principal
- crea predicciones demo
- ejecuta scoring demo
- recalcula `users` y `leagueStandings`

Capacidades actuales del flujo demo:

- `reset:competition-demo` limpia solo la capa demo
- `fresh:competition-demo` reconstruye el escenario completo en un paso
- si la demo quedó montada sobre un usuario real existente, el reset recompone sus aggregates y `leaguesCount`
- el comando raíz `pnpm dev:demo` deja el entorno listo con demo fresca y luego levanta web + api

### Uso recomendado para sesiones próximas

Flujo sugerido:

1. asegurar base del torneo con `dev:setup` / `ensure:wc2026`
2. correr `fresh:competition-demo` cuando se quiera probar loop competitivo desde cero
3. validar manualmente UI + backend
4. usar `reset:competition-demo` o `fresh:competition-demo` cuando se quiera rehacer el escenario

### Decisión sobre testing con resultados reales

También quedó definido que el testeo con fuente real de resultados ocurrirá en una etapa separada.

No se debe mezclar todavía:

- testing del producto y sus reglas internas
- testing de integración con una fuente externa

Secuencia prevista:

1. endurecer primero el producto con demo data controlada
2. implementar luego la capa de ingestión real
3. probar esa ingestión primero con `dry-run`
4. recién después persistir resultados reales sobre pocos partidos
5. verificar scoring y standings con supervisión manual

Comandos objetivo a futuro para esa etapa:

- `fetch:results --dry-run`
- `fetch:results`
- `score:match <matchId>`
- `rebuild:standings`

Esta decisión debe considerarse vigente salvo que una sesión futura la cambie explícitamente.

## Estado actual post primer corte competitivo

Quedó implementado un primer cierre funcional de `Epic 3`:

- `packages/shared` ya expone contratos para:
  - `points`
  - `leagues`
  - `standings`
- `apps/api` ya expone:
  - `GET /api/v1/points`
  - `GET /api/v1/leagues`
  - `GET /api/v1/leagues/:leagueId/standings`
- ya existe:
  - scoring engine puro match-level
  - recomputo de aggregates de usuario
  - materialización de standings por liga

## Estado actual de la Web competitiva

- `/rankings` ya dejó de ser placeholder
- `/leagues` ya dejó de ser placeholder
- ambas vistas consumen datos reales del backend
- la UI actual sigue siendo mínima / MVP, pero ya valida:
  - puntos
  - standings
  - lectura de ligas

## Estado actual del workflow demo

Scripts disponibles:

- `pnpm --filter @prode/api seed:competition-demo`
- `pnpm --filter @prode/api reset:competition-demo`
- `pnpm --filter @prode/api fresh:competition-demo`
- `pnpm dev:demo`

Comportamiento validado:

- `fresh:competition-demo` resetea y vuelve a sembrar en un solo paso
- si la demo se montó sobre un usuario real existente, el reset recompone:
  - `totalPoints`
  - `exactHits`
  - `correctSigns`
  - `leaguesCount`

## Foco recomendado actualizado

La siguiente épica recomendada ya no es seguir ampliando infra de demo, sino pasar a producto:

- entrar a `Epic 4 — Leagues, Invite Flow, Membership & League Detail`
- aprovechar la demo competitiva ya operativa para validar:
  - create league
  - join flow
  - detalle de liga
  - salto a standings

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

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

## Actualización operativa nueva: Local Kanban

- se adoptó `Local Kanban` como sistema operativo agéntico para esta fase del proyecto
- instalación local activa en:
  - `/Users/tzanchetti/Documents/Codex/local-kanban`
- proyecto registrado en:
  - `/Users/tzanchetti/Documents/Codex/local-kanban/config/projects.json`
- `AGENTS.md` ya importa el contrato normativo de `Local Kanban`
- el backlog de ejecución inmediata ya vive también en:
  - `docs/kanban/epics`
  - `docs/kanban/stories`

Estado real de esa adopción:

- ya no es una prueba documental
- fue usado para desglosar, ejecutar y cerrar la iteración UX/UI reciente

## Actualización técnica nueva: base inicial de i18n

- `apps/web` ya tiene una base i18n liviana para `ESP / ENG`
- se decidió evitar por ahora una librería pesada
- la base actual incluye:
  - provider de locale
  - persistencia local
  - helper de copy por locale
  - helper de formateo fecha/hora por locale
  - toggle visible `ESP / ENG`

Primer slice ya vivo:

- shell autenticado
- bottom nav
- `home`
- `matches`
- flujo principal de predicción

Pendiente natural:

- extender el mismo patrón a:
  - `rankings`
  - `profile`
  - `tournament`
  - pantallas públicas / login

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

Actualización nueva sobre esta capa:

## Actualizacion operativa nueva: V3 ya arrancada en codigo

Durante la sesión actual se ejecutaron y validaron las dos primeras historias de `EPI-UX-002`:

- `STO-UX-011`
  - recalibración real de tokens visuales, superficies, spacing y jerarquía base en `packages/ui`
- `STO-UX-012`
  - sistema robusto de identidad de selecciones con soporte de datos y assets locales

Resultado concreto de esa ejecución:

- `packages/ui` ya tiene una base V3 más consistente:
  - niveles visuales más claros
  - menor ruido de bordes / wrappers
  - CTA más nítidas
  - mejor densidad vertical
- la identidad de equipos ya no depende primariamente de monogramas
- `packages/shared` y `apps/api` ya exponen identidad estable por selección con:
  - `fifaCode`
  - `iso2`
  - `iso3`
  - `flagAsset`
  - `flagUrl`
- `apps/web` ya consume esa identidad en:
  - `home`
  - `matches`
  - `match detail`
  - `quick prediction`
  - `marathon mode`
  - `tournament`
- se versionaron assets locales de banderas en:
  - `apps/web/public/flags`

Validación ejecutada para este bloque:

- `typecheck` global OK
- `test` global OK

Próximo foco operativo ya definido:

- `STO-UX-013`
  - adelgazar `header`
  - limpiar `bottom nav`
  - reordenar jerarquía global de CTA

Estado Git real al cierre esperado de esta sesión:

- branch de trabajo activa:
  - `codex/epic-3-5-testing-closeout`
- esta rama ya no está solo en cierre documental:
  - ahora contiene arranque real de implementación V3

## Actualizacion operativa nueva: UX/UI Elevation V3 antes de Epic 4

Luego de una nueva review de producto sobre la app ya construida, se decidió abrir una segunda pasada UX/UI fuerte antes de iniciar la implementación funcional de `Epic 4`.

La decisión quedó cerrada así:

- `Epic 4` sigue siendo el próximo bloque funcional grande
- pero no se arranca todavía con create/join/detail real de ligas
- primero se ejecuta una nueva épica de elevación visual y de producto:
  - `docs/kanban/epics/EPI-UX-002.md`
- esta épica toma como source doc el review:
  - `/Users/tzanchetti/Documents/NewCo - Proyectos/Prode Mundial/PRODE MUNDIAL — UX_UI ITERATION V3.md`

Objetivo de esta fase:

- pasar de una app MVP usable a una app más consumible
- reforzar la sensación de producto deportivo premium
- consolidar componentes compartidos reales
- limpiar navegación, copy, estados y densidad visual
- resolver el sistema de banderas de forma robusta

Orden de trabajo acordado antes de `Epic 4`:

1. `STO-UX-011`
   - recalibrar tokens, superficies, spacing y jerarquía base
2. `STO-UX-012`
   - resolver flags + identity system con soporte de datos/back
3. `STO-UX-013`
   - aligerar header, bottom nav y jerarquía global de CTA
4. `STO-UX-014`
   - rediseñar `Home` V3 con hero protagonista
5. `STO-UX-015`
   - elevar el flujo de predicción y score picker
6. `STO-UX-016`
   - compactar fixtures y redefinir estados
7. `STO-UX-017`
   - pulir standings / ligas sin invadir el alcance funcional de `Epic 4`
8. `STO-UX-018`
   - cerrar V3 con empty/loading, copy cleanup y QA visual global

Regla operativa importante:

- dentro de esta fase, el único refuerzo de backend/datos explícitamente aceptado es el de banderas / identidad de equipos
- no usar esta épica para colar create league, join league o detalle de liga real
- la frontera con `Epic 4` debe mantenerse explícita en docs y en UI

Resultado esperado al cierre de esta fase:

- base visual más sólida
- momentos críticos de producto más pulidos
- sistema compartido más consistente
- app más lista para abrir `Epic 4` sin arrastrar deuda visual fuerte

- `Home` fue reforzada aún más con piezas reusables:
  - `NextMatchHero`
  - `ProgressCompact`
- `Matches` quedó alineada con esa misma gramática visual
- `Posiciones` ya fue reencuadrada como competencia social cerrada, sin tono técnico
- `Perfil` ya quedó single-column mobile-first
- `Tu Mundial` ya comunica mejor estados de grupo y clasificados proyectados

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

Actualización reciente adicional:

- `corepack pnpm --filter @prode/web typecheck`
- `corepack pnpm --filter @prode/web test`

También OK luego de:

- adopción de `Local Kanban`
- nueva iteración UX/UI
- primer slice bilingüe `ESP / ENG`

## Estado actual del Kanban local

Dentro de `EPI-UX-001` quedaron en `done`:

- `STO-UX-001`
- `STO-UX-002`
- `STO-UX-003`
- `STO-UX-004`
- `STO-UX-005`
- `STO-UX-006`
- `STO-UX-007`
- `STO-UX-008`
- `STO-UX-010`

Pendiente principal:

- `STO-UX-009`
  - historia puente para separar lo que es puro polish UI de lo que ya debe entrar como desarrollo real de `Epic 4`

## Próximo foco recomendado

Orden sugerido de continuidad:

1. definir si se hace una segunda fase de i18n
2. tomar `STO-UX-009`
3. preparar la migración de `Epic 4+` al esquema `Local Kanban`
4. abrir ejecución de `Epic 4`

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

---

# Actualizacion operativa nueva: cierre formal de V3

Durante la sesion documentada en:

- `docs/handoff/Prode Mundial_WS20_12042026.md`

quedo cerrado en codigo el bloque completo restante de:

- `EPI-UX-002 / UX_UI Elevation V3`

Historias cerradas en esa pasada:

- `STO-UX-013`
- `STO-UX-014`
- `STO-UX-015`
- `STO-UX-016`
- `STO-UX-017`
- `STO-UX-018`

Resultado real consolidado:

- navegacion global mas liviana y menos shell-like
- `Home` mas editorial y enfocada en la accion principal
- flujo de prediccion reforzado en quick modal y marathon
- lista de partidos mas compacta y escaneable
- capa social pulida sin adelantar funcionalidad real de ligas
- cleanup final de copy, loading states y coherencia visual

Validacion ejecutada en esa sesion:

- `./pnpm typecheck`
- `./pnpm test`

Resultado:

- `typecheck` global OK
- `test` global OK

Nuevo criterio de continuidad:

- tratar `UX_UI Elevation V3` como baseline cerrada
- no reabrir polish general salvo bug o regresion concreta
- el siguiente foco documentado natural pasa a ser `Epic 4 — Leagues, Invite Flow, Membership & League Detail`

Estado Git esperado para retoma posterior:

- branch de cierre: `codex/epic-3-5-testing-closeout`
- handoff mas reciente de referencia:
  - `docs/handoff/Prode Mundial_WS20_12042026.md`

---

# Actualizacion operativa nueva: Epic 4 slice 1 ya abierto

Durante la sesion documentada en:

- `docs/handoff/Prode Mundial_WS21_13042026.md`

quedo abierto en codigo el primer slice vertical real de:

- `Epic 4 — Leagues, Invite Flow, Membership & League Detail`

Alcance efectivamente entregado:

- contratos shared nuevos para:
  - `CreateLeagueInput`
  - `JoinLeagueInput`
  - `LeagueDetail`
  - `LeagueMembershipRole`
- API nueva y operativa para:
  - `POST /api/v1/leagues`
  - `POST /api/v1/leagues/join`
  - `GET /api/v1/leagues/:leagueId`
- reglas base ya resueltas:
  - creacion de liga con owner inicial
  - generacion de `inviteCode`
  - generacion de `inviteToken`
  - `inviteLink` derivado
  - unicidad logica de membership por `(leagueId, userId)`
  - bloqueo por `ALREADY_LEAGUE_MEMBER`
  - bloqueo por `LEAGUE_INACTIVE`
  - bloqueo por `LEAGUE_CAPACITY_REACHED`
  - bloqueo por `INVITE_INVALID`
- `apps/web` ya abre flows reales dentro de `Ligas` para:
  - crear liga
  - unirse por codigo
  - ver estado de exito con codigo e invite link

Validacion ejecutada en esta sesion:

- `./pnpm typecheck`
- `./pnpm test`

Resultado:

- `typecheck` global OK
- `test` global OK

Nuevo punto exacto de continuidad:

- siguiente slice natural de `Epic 4`:
  - invite landing publica por token
  - join autenticado desde link publico
  - detail page de liga conectada a UI
  - navegacion desde `Ligas` al detalle y desde detalle a standings

---

# Actualizacion operativa nueva: Epic 4 slice 2 ya abierto

Durante la sesion documentada en:

- `docs/handoff/Prode Mundial_WS22_13042026.md`

quedo abierto en codigo el segundo slice vertical de `Epic 4`.

Alcance efectivamente entregado:

- endpoint publico nuevo:
  - `GET /api/v1/public/leagues/invite/:inviteToken`
- `POST /api/v1/leagues/join` ya acepta:
  - `inviteCode`
  - `inviteToken`
- `apps/web` ya tiene:
  - landing publica de invitacion en `/leagues/join?token=...`
  - join autenticado desde link publico
  - detalle protegido de liga en `/leagues/[leagueId]`
  - navegacion desde `Ligas` al detalle
  - salto desde detalle a `Posiciones` con `leagueId` preseleccionada

Validacion ejecutada en esta sesion:

- `./pnpm typecheck`
- `./pnpm test`

Resultado:

- `typecheck` global OK
- `test` global OK

Nuevo punto exacto de continuidad:

- siguiente slice natural de `Epic 4`:
  - polish del detail page
  - CTA contextual desde standings de vuelta al detail
  - QA manual completa de create -> invite -> login -> join -> detail -> rankings
  - cierre formal de la epica o apertura de bugs/regresiones puntuales

---

# Actualizacion operativa nueva: Epic 4 validada y lista para cierre formal

Durante la sesion documentada en:

- `docs/handoff/Prode Mundial_WS23_13042026.md`

se ejecuto el cierre operativo de `Epic 4` sin abrir features nuevas.

Resultado efectivo:

- `Epic 4` queda validada manualmente sobre el flujo completo:
  - create
  - share / invite
  - open invite
  - login con retorno
  - join
  - detail
  - rankings
- las validaciones automatizadas siguen en verde:
  - `./pnpm typecheck`
  - `./pnpm test`
- no quedaron bugs bloqueantes documentados para la capa social actual

Nuevo criterio de continuidad:

- `Epic 4 — Leagues, Invite Flow, Membership & League Detail` puede tratarse como cerrable
- el siguiente foco natural del backlog pasa a ser:
  - `Epic 5 — Macro Picks & Post-Group Adjustment`
- el arranque recomendado para `Epic 5` mantiene el orden obligatorio:
  - contratos shared
  - logica de dominio y persistencia backend
  - endpoints API
  - UI de `macro-picks`
  - tests minimos utiles

Estado Git esperado para la siguiente ejecucion:

- abrir branch dedicada para `Epic 5`
- no reabrir `Epic 4` salvo bug/regresion concreta detectada durante implementacion posterior

---

# Actualizacion operativa nueva: Epic 5 slice 1 ya abierto

Durante la sesion documentada en:

- `docs/handoff/Prode Mundial_WS24_13042026.md`

quedo abierto en codigo el primer slice tecnico de:

- `Epic 5 — Macro Picks & Post-Group Adjustment`

Alcance efectivamente entregado:

- `packages/shared` ya expone el dominio base de `macro-picks`:
  - constantes de grupos `A-L`
  - estados del modulo macro
  - penalty model del ajuste
  - contratos y schemas para:
    - `GET /api/v1/macro-picks`
    - `PUT /api/v1/macro-picks`
    - `POST /api/v1/macro-picks/adjustment`
  - nuevos `ApiErrorCode` publicos:
    - `INVALID_GROUP_PICK_DUPLICATE`
    - `INVALID_FINALISTS_DUPLICATE`
    - `INVALID_CHAMPION_NOT_IN_FINALISTS`
    - `MACRO_PICKS_LOCKED`
    - `ADJUSTMENT_NOT_AVAILABLE`
    - `ADJUSTMENT_ALREADY_USED`
- `apps/api` ya tiene dominio operativo inicial:
  - repositorio `macroPredictions`
  - servicio de estado / deadlines / completion
  - guardado inicial de picks
  - confirmacion de ajuste
  - derivacion server-side de:
    - `status`
    - `isLocked`
    - `adjustmentAvailable`
    - `adjustmentAlreadyUsed`
    - `completion`
- endpoints ya abiertos:
  - `GET /api/v1/macro-picks`
  - `PUT /api/v1/macro-picks`
  - `POST /api/v1/macro-picks/adjustment`
- cobertura automatizada nueva:
  - tests de servicio para estado inicial, draft save, validacion de finalistas y ajuste
  - tests HTTP para GET / PUT / POST de `macro-picks`

Validacion ejecutada en esta sesion:

- `./pnpm typecheck`
- `./pnpm test`

Resultado:

- `typecheck` global OK
- `test` global OK

Nuevo punto exacto de continuidad:

- siguiente slice natural de `Epic 5`:
  - abrir UI real de `macro-picks` en `apps/web`
  - modelar pantalla editable + progreso + deadline
  - exponer estado bloqueado y ajuste disponible
  - conectar guardado inicial y confirmacion de ajuste

---

# Actualizacion operativa nueva: Epic 5 slice 2 ya abierto

Durante la sesion documentada en:

- `docs/handoff/Prode Mundial_WS25_13042026.md`

quedo abierto en codigo el segundo slice vertical de `Epic 5`.

Alcance efectivamente entregado:

- `apps/web` ya tiene ruta protegida nueva:
  - `/macro-picks`
- `apps/web` ya consume la API nueva con cliente real para:
  - `GET /api/v1/macro-picks`
  - `PUT /api/v1/macro-picks`
  - `POST /api/v1/macro-picks/adjustment`
- ya existe pantalla real `Macro Picks` con:
  - hero + estado del modulo
  - progreso de completitud
  - deadlines visibles
  - formulario editable por grupos `A-L`
  - finalistas + campeon
  - guardado draft / submitted
  - lectura readonly del estado bloqueado
  - flujo visible de ajuste disponible
  - estado readonly de ajuste ya confirmado
- `Tu Mundial` ya suma CTA explicita para abrir `Macro Picks`
- tests UI nuevos cubren:
  - draft editable
  - locked original
  - adjustment available

Validacion ejecutada en esta sesion:

- `./pnpm --filter @prode/web typecheck`
- `./pnpm --filter @prode/web test`
- `./pnpm typecheck`
- `./pnpm test`

Resultado:

- `typecheck` web OK
- `test` web OK
- `typecheck` global OK
- `test` global OK

Nuevo punto exacto de continuidad:

- siguiente slice natural de `Epic 5`:
  - polish UX del flujo macro
  - mejorar validaciones client-side y mensajes de error por regla
  - decidir si el acceso a `Macro Picks` tambien sube a `home`
  - revisar si el modulo ya queda cerrable en web o si conviene una pasada visual adicional

---

# Actualizacion operativa nueva: Epic 5 slice 3 UX polish

Durante la sesion documentada en:

- `docs/handoff/Prode Mundial_WS26_13042026.md`

se cerro un polish UX corto sobre la pantalla web de `Macro Picks`.

Alcance efectivamente entregado:

- validaciones client-side nuevas para evitar combinaciones imposibles:
  - equipo duplicado en 1° y 2° de un mismo grupo
  - finalistas duplicados
  - campeon fuera de una dupla valida de finalistas
  - ajuste post-grupos incompleto o inconsistente
- CTA principal ahora se bloquea cuando la combinacion actual es invalida
- la pantalla ya muestra:
  - card de ayuda sobre lo que falta para cerrar el pick inicial
  - mensajes especificos de validacion antes de guardar
  - mensajes especificos dentro del bloque de ajuste
  - feedback de guardado draft con porcentaje de completitud
- cobertura automatizada ampliada para:
  - validaciones de picks iniciales
  - validaciones del ajuste
  - hint de completitud

Validacion ejecutada en esta sesion:

- `./pnpm --filter @prode/web typecheck`
- `./pnpm --filter @prode/web test`

Resultado:

- `typecheck` web OK
- `test` web OK

Nuevo punto exacto de continuidad:

- `Epic 5` queda muy cerca de cerrable en web
- siguiente paso recomendado:
  - decidir si se suma o no un acceso a `Macro Picks` desde `home`
  - hacer una pasada visual/manual corta en mobile + desktop
  - si no aparecen fricciones nuevas, marcar `Epic 5` como cerrable y recien ahi abrir `Epic 6`

---

# Actualizacion operativa nueva: Epic 5 cerrada

Durante la sesion documentada en:

- `docs/handoff/Prode Mundial_WS27_13042026.md`

`Epic 5 — Macro Picks & Post-Group Adjustment` queda cerrada a nivel MVP.

Criterio de cierre alcanzado:

- backend/shared del modulo macro implementado
- endpoints reales operativos para lectura, guardado inicial y ajuste
- pantalla web protegida operativa con todos los estados principales del flujo
- validaciones UX minimas cubiertas
- CTA desde `Tu Mundial` operativa
- validacion automatizada OK
- QA manual final OK en revision local desktop + mobile

Decision explicita de alcance:

- no se suma por ahora acceso adicional desde `home`
- para MVP alcanza con descubribilidad desde `Tu Mundial`
- scoring macro real e impacto en standings quedan fuera de `Epic 5`

Validacion consolidada para cierre:

- `./pnpm --filter @prode/web typecheck`
- `./pnpm --filter @prode/web test`
- `./pnpm typecheck`
- `./pnpm test`
- QA manual final del flujo `Tu Mundial -> Macro Picks`

Resultado:

- `Epic 5` cerrada

Nuevo punto exacto de continuidad:

- siguiente bloque recomendado:
  - abrir `Epic 6`
  - conectar scoring macro real
  - impactar puntos / standings
  - definir strategy de recomputacion y visibilidad del resultado

---

# Actualizacion operativa nueva: Epic 6 foundation backend ya implementada

Durante la sesion documentada en:

- `docs/handoff/Prode Mundial_WS28_14042026.md`

se abrio `Epic 6` y quedo cerrada su base tecnica principal del lado backend.

Alcance efectivamente entregado:

- reglas shared de `macro scoring` formalizadas
- contratos/schemas nuevos para:
  - `MacroScoringBreakdown`
  - `MacroScoringLog`
  - `MacroTournamentResults`
- engine puro de scoring macro ya implementado en API
- scoring por usuario ya operativo
- batch de scoring por torneo ya operativo
- rebuild full idempotente ya operativo
- nueva fuente oficial minima:
  - `macroResults/{tournamentId}`
- `user aggregates` ahora recomponen:
  - `macroPoints`
  - `totalPoints = matchPoints + macroPoints`
- standings de ligas ya reflejan impacto de macro scoring via rebuild

Actualizacion operativa nueva adicional:

- `apps/api` ya expone scripts locales para:
  - cargar `macroResults`
  - correr `score:macro`
  - correr `rebuild:macro`
- `apps/jobs` ya soporta:
  - `JOB_NAME=score-macro`
  - `TOURNAMENT_ID`

Validacion ejecutada en esta sesion:

- `corepack pnpm --filter @prode/shared build`
- `corepack pnpm --filter @prode/api typecheck`
- `corepack pnpm --filter @prode/api test`
- `corepack pnpm --filter @prode/jobs typecheck`
- `corepack pnpm --filter @prode/jobs test`

Resultado:

- todo OK

Nuevo punto exacto de continuidad:

- siguiente slice recomendado:
  - operacion/admin minima para disparar `score-macro`
  - evaluar endpoint admin para upsert de `macroResults`
  - revisar si `points`, `home` o standings necesitan breakdown macro adicional

---

# Actualizacion operativa nueva: Epic 6 cerrada

Durante la sesion documentada en:

- `docs/handoff/Prode Mundial_WS29_14042026.md`

`Epic 6 — Macro Scoring, Rebuilds & Standings Impact` queda cerrada a nivel MVP.

Criterio de cierre alcanzado:

- scoring macro real ya operativo de punta a punta
- logs macro persistidos y reutilizados como fuente de read models
- `users.macroPoints` y `users.totalPoints` consistentes via recomputacion
- standings de liga reflejan impacto macro de forma efectiva
- `apps/jobs` ya soporta:
  - `JOB_NAME=score-macro`
  - `JOB_NAME=rebuild-macro`
- `GET /api/v1/points` ya expone resumen mas completo con:
  - `matchPoints`
  - `totals`
  - `byStage`
  - `recentMatches` enriquecido
- `GET /api/v1/macro-picks` ya puede devolver `fully_scored`
- `rankings` ya refleja mejor el impacto visible del cierre

Validacion consolidada para cierre:

- `corepack pnpm --filter @prode/shared build`
- `corepack pnpm --filter @prode/api test`
- `corepack pnpm --filter @prode/jobs test`
- `corepack pnpm --filter @prode/web test`
- `corepack pnpm --filter @prode/api typecheck`
- `corepack pnpm --filter @prode/jobs typecheck`
- `corepack pnpm --filter @prode/web typecheck`

Resultado:

- `Epic 6` cerrada

Nuevo punto exacto de continuidad:

- siguiente bloque recomendado:
  - abrir `Epic 8`
  - implementar admin ops minima API-first
  - arrancar por triggers manuales, lectura operativa e ingesta/correccion de resultados

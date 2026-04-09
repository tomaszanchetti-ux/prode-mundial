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
  - working tree con cambios de codigo de arranque para `Epic 2 / CARD 0`

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

Con `CARD 0` ya iniciada, el siguiente foco natural dentro de `Epic 2` es bajar el contrato compartido y el modelo de estados del flujo de partidos.

Orden recomendado:

1. cerrar y commitear el avance de `CARD 0`
2. usar `CARD 1` ya cerrada como base para `CARD 2` y `CARD 3`
3. seguir con seed de teams/groups/matches y luego repositorios/use-cases/endpoints del flujo real

---

# Regla de mantenimiento

Actualizar este documento al cierre de cada sesión relevante.

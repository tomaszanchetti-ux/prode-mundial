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
  - branch activa: `main`
  - auth real ya validada localmente sobre Firebase del proyecto `prode-mundial-4e419`
  - `Epic 1` quedó cerrada y publicada en:
    - `origin/epic/epic-1-foundation-auth-shell`
    - `origin/main`
  - commit base estable actual: `c6aa2a1`
  - working tree con cambios documentales locales de integración del design system y ajuste de planning para `Epic 2`

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

Con `Epic 1` ya cerrada y `main` creada como nueva base estable, el siguiente foco natural es `Epic 2`.

Orden recomendado:

1. abrir branch de `Epic 2` desde `main`
2. arrancar por la base de UI/tokens/componentes en `packages/ui` según `docs/product/DESIGN_SYSTEM.md`
3. seguir con contratos compartidos, fixtures, detalle y predicciones match-level

---

# Regla de mantenimiento

Actualizar este documento al cierre de cada sesión relevante.

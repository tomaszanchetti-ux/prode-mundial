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

Avance adicional de `Epic 1`:

- contratos compartidos alineados con API spec para `public/bootstrap` y `me`
- `apps/api` ya expone `GET /api/v1/public/bootstrap`, `GET /api/v1/me` y `PATCH /api/v1/me`
- validación uniforme de payloads y envelope estándar reutilizable
- validación real de Firebase ID token en API vía `firebase-admin`
- persistencia de perfiles autenticados en Firestore sobre colección `users`
- `apps/web` ya muestra:
  - landing pública alineada al sitemap
  - pantalla `/login` conectada a Google + magic link
  - shell autenticado con tabs `home`, `matches`, `rankings`, `leagues`, `profile`
  - guards de sesión cliente con redirect a `/login`
  - redirect de perfil incompleto hacia `/profile`
  - pantalla de perfil conectada a sesión Firebase real con logout
- estado Git actual:
  - branch activa: `epic/epic-1-foundation-auth-shell`
  - commit inicial publicado en remoto
  - working tree con cambios locales de continuación sobre Epic 1

## Tooling relevante

- Node disponible
- `pnpm` usable vía `corepack pnpm`
- existe wrapper local `./pnpm` para compatibilidad con `turbo`

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

Seguir con `EPIC 1`:

1. probar el flujo end-to-end con credenciales Firebase reales
2. endurecer manejo de errores UX para popup cancelado, link expirado y token inválido
3. agregar tests mínimos de auth guard, login render y rechazo de API sin token
4. documentar setup Firebase en README y helpers de desarrollo
5. conectar `/home` al endpoint real cuando exista

---

# Regla de mantenimiento

Actualizar este documento al cierre de cada sesión relevante.

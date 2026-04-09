# Prode Mundial_WS2_09042026

## Resumen de la sesión

Sesión dedicada a continuar `Epic 1` sobre el skeleton inicial:

- alineación de contratos compartidos con el canon/API spec
- endurecimiento de la API base
- expansión de la web pública y del shell autenticado

---

# 1. Qué se hizo

## Shared contracts

- se actualizó `packages/shared` para reflejar el contrato canónico de `GET /api/v1/public/bootstrap`
- se completó el shape de `UserProfile` con campos del data model canónico:
  - `photoUrl`
  - `exactHits`
  - `correctSigns`
- se agregaron schemas más estrictos para bootstrap y profile update
- se sumó la tab `Rankings` y rutas de soporte:
  - `/rules`
  - `/terms`
  - `/privacy`

## API

- se normalizó el uso del envelope `{ ok, data }` y error estándar
- se agregó helper de validación para payloads con `zod`
- se dejó `GET /api/v1/public/bootstrap` alineado al contrato oficial
- se implementó:
  - `GET /api/v1/me`
  - `PATCH /api/v1/me`
- se creó un `usersRepository` temporal en memoria para bootstrap de perfil
- se dejó middleware auth temporal por bearer token para permitir desarrollo local del shell y perfil sin credenciales Firebase

## Web

- se rehizo la landing pública con hero, features, CTA y links de soporte
- se creó `/login` como base UX para Google + magic link
- se agregó layout protegido y tabs core:
  - `/home`
  - `/matches`
  - `/rankings`
  - `/leagues`
  - `/profile`
- se conectó `/profile` al backend usando token local de desarrollo para demostrar el flujo de lectura/edición mínima del perfil

## Verificaciones

- `./pnpm typecheck` OK
- `./pnpm build` OK
- `./pnpm test` OK
- branch creada: `epic/epic-1-foundation-auth-shell`
- commit realizado: `feat: bootstrap epic 1 foundation slice`
- push realizado a `origin/epic/epic-1-foundation-auth-shell`

Nota:

- el primer `typecheck` falló por artefactos viejos de `.next`, pero tras regenerar el build el estado final quedó OK

---

# 2. Estado resultante

El proyecto ya no está solo en skeleton:

- la base de contratos de `Epic 1` quedó más cercana al canon
- existe una API mínima usable para bootstrap público y perfil autenticado
- la web ya tiene una landing pública defendible y un shell autenticado navegable
- la sesión ya quedó respaldada en GitHub sobre la branch de la épica

Todavía no hay auth real ni persistencia productiva.

---

# 3. Pendientes

## Técnicos

- integrar Firebase Auth real en `apps/web`
- validar Firebase ID token real en `apps/api`
- persistir perfiles en Firestore
- reemplazar token local de desarrollo por sesión real
- agregar guards/redirects reales
- implementar flujo de completar perfil si `profileCompleted = false`

## UX / producto

- resolver pantalla/check de magic link
- completar estados de loading/error/success del auth flow
- conectar `/home` con endpoint real cuando exista

---

# 4. Qué debe hacerse en la próxima sesión

Recomendación:

1. tomar `Card 5 — Firebase Auth Integration`
2. usar la base nueva de `/api/v1/me` para bootstrap real del usuario
3. conectar login real con Google y dejar magic link scaffolded o implementado según credenciales disponibles
4. cerrar guards y redirects de rutas protegidas
5. seguir trabajando sobre la misma branch de épica hasta completar QA de `Epic 1`

---

# 5. Riesgos o notas

- el bearer auth actual en API es temporal y solo sirve para desarrollo local
- `/profile` usa `NEXT_PUBLIC_DEV_SESSION_TOKEN` con fallback a `dev-user`
- a partir de esta sesión se adopta flujo sin PRs:
  - branch por épica
  - commit + push por sesión
  - merge a `main` solo después de QA al cerrar la épica

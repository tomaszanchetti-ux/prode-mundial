# Prode Mundial_WS3_09042026

## Resumen de la sesión

Sesión dedicada a avanzar el núcleo pendiente de `Epic 1`:

- integración real de Firebase Auth entre web y API
- persistencia inicial de perfiles en Firestore
- guards de sesión y redirects post-login

---

# 1. Qué se hizo

## Web

- se agregó `firebase` en `apps/web`
- se creó inicialización cliente Firebase con persistencia local de sesión
- se agregó `AuthProvider` para centralizar:
  - usuario autenticado
  - bootstrap de perfil contra `/api/v1/me`
  - login con Google
  - envío de magic link
  - resolución de magic link
  - logout
- se creó `AuthGuard` para rutas protegidas
- `/login` dejó de ser placeholder y ahora:
  - dispara Google sign-in
  - envía magic link
  - completa sign-in al volver desde email
  - redirige a `/profile` si `profileCompleted = false`
  - redirige a `/home` si el perfil ya está completo
- `/profile` ya usa la sesión Firebase real, actualiza el perfil contra API y permite logout

## API

- se agregó `firebase-admin` en `apps/api`
- se creó bootstrap admin para:
  - validar bearer Firebase ID token
  - acceder a Firestore
- el middleware auth dejó de usar token fake y ahora construye `AuthContext` desde `verifyIdToken`
- `usersRepository` dejó el storage en memoria y pasó a Firestore:
  - colección `users`
  - creación on-first-login
  - update de perfil con `updatedAt`
  - reutilización del documento existente
- los casos de uso y controllers de `me` pasaron a async para soportar persistencia real

## Docs

- se actualizó `README.md` con el nuevo estado funcional de Epic 1
- se actualizó `PROJECT_MEMORY.md` para reflejar auth real + Firestore

## Dev / integración local

- se creó `.env` local raíz para API
- se creó `apps/web/.env.local` para exponer `NEXT_PUBLIC_FIREBASE_*` a Next
- se corrigió la carga de env en `apps/api` para leer el `.env` raíz antes de inicializar Firebase Admin
- se agregó CORS explícito para desarrollo local entre `web` y `api`
- se validó la activación real de Firebase Auth y Firestore sobre el proyecto `prode-mundial-4e419`

---

# 2. Verificaciones

- `./pnpm typecheck` OK
- `./pnpm build` OK
- `./pnpm test` OK
- `GET /health` OK en local
- `GET /api/v1/public/bootstrap` OK en local
- login real con Firebase OK
- perfil autenticado ya alcanza backend sin token fake
- commit realizado: `6c25b39`
- push realizado a `origin/epic/epic-1-foundation-auth-shell`

---

# 3. Estado resultante

La base de `Epic 1` quedó mucho más cerca del flujo demo objetivo:

- la web ya tiene sesión real persistida
- la API ya valida tokens Firebase reales
- el perfil autenticado ya puede crearse y persistirse en Firestore
- el shell protegido ya no depende del token local de desarrollo
- el entorno local ya quedó operativo con `web` + `api` y auth real validada

---

# 4. Pendientes recomendados

1. cubrir errores UX específicos del auth flow
2. agregar tests mínimos de login/guard/API unauthorized
3. documentar setup Firebase paso a paso para otro developer
4. decidir si el bootstrap público local debe tolerar mejor caída de API para DX

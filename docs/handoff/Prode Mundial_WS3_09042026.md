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

---

# 2. Verificaciones

- `./pnpm typecheck` OK
- `./pnpm build` OK
- `./pnpm test` OK

---

# 3. Estado resultante

La base de `Epic 1` quedó mucho más cerca del flujo demo objetivo:

- la web ya tiene sesión real persistida
- la API ya valida tokens Firebase reales
- el perfil autenticado ya puede crearse y persistirse en Firestore
- el shell protegido ya no depende del token local de desarrollo

Todavía falta QA funcional con credenciales Firebase reales para confirmar el recorrido completo Google + magic link en entorno local.

---

# 4. Pendientes recomendados

1. probar login Google y magic link con proyecto Firebase real
2. cubrir errores UX específicos del auth flow
3. agregar tests mínimos de login/guard/API unauthorized
4. documentar setup Firebase paso a paso para otro developer

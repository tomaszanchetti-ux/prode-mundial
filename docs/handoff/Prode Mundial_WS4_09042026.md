# Prode Mundial_WS4_09042026

## Resumen de la sesión

Sesión enfocada en cerrar los pendientes operativos de `Epic 1` para acercarla a su definición real de done.

---

# 1. Qué se hizo

## Auth UX

- se mejoró el mapeo de errores de Firebase Auth en web
- Google login ahora informa mejor:
  - popup cancelado por usuario
  - popup bloqueado por navegador
  - request cancelado por popup ya en curso
- magic link ahora informa mejor:
  - email inválido o faltante
  - action code inválido
  - link expirado
  - errores de red
- si `/api/v1/me` responde `401`, la sesión cliente vuelve a estado no autenticado con mensaje claro para relogin

## Web DX / bootstrap público

- la landing pública ahora tolera caída de la API local
- si falla `GET /api/v1/public/bootstrap`, la web usa `DEFAULT_PUBLIC_BOOTSTRAP` como fallback de desarrollo

## Tests

- se agregó runtime de tests con `tsx` en la raíz del monorepo
- `apps/web` ahora tiene tests reales para:
  - `resolveNextRoute`
  - `resolveAuthGuardRedirect`
  - `resolveHelperTone`
  - render básico de `LoginScreenView`
- `apps/api` ahora tiene tests reales para:
  - `GET /api/v1/me` sin bearer token => `401`
  - `GET /api/v1/me` con token inválido => `401`

## Docs

- se actualizó `README.md` con setup Firebase paso a paso
- se agregó troubleshooting básico para auth local
- se actualizó `PROJECT_MEMORY.md` con el nuevo estado de cierre de `Epic 1`

---

# 2. Verificaciones

- `./pnpm --filter @prode/web typecheck` OK
- `./pnpm --filter @prode/api typecheck` OK
- `./pnpm --filter @prode/web test` OK
- `./pnpm --filter @prode/api test` OK
- `./pnpm typecheck` OK
- `./pnpm test` OK
- `./pnpm build` OK
- `./pnpm --filter @prode/web build` OK luego del ajuste final de fallback en landing

---

# 3. Estado resultante

`Epic 1` queda mucho más cerca de cierre real:

- flujo auth ya no depende solo del happy path
- la base ya tiene tests mínimos útiles
- la documentación local permite repetir setup sin conocimiento implícito
- la landing pública es menos frágil en desarrollo local

---

# 4. Próximo paso recomendado

1. revisar la DoD de `Epic 1` una última vez contra lo ya implementado
2. si no aparece ningún gap adicional, dar `Epic 1` por cerrable
3. pasar al plan de arranque de `Epic 2`

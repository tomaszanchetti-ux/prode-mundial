# Prode Mundial

Bootstrap inicial del monorepo para el MVP de Prode Mundial.

## Stack

- `apps/web`: Next.js
- `apps/api`: Node.js + Express + TypeScript
- `apps/jobs`: runners batch skeleton
- `apps/admin`: placeholder administrativo
- `packages/shared`: contratos y tipos compartidos

## Documentación base

- `AGENTS.md`
- `ATOMIC_TASKING_GUIDE.md`
- `docs/product`
- `docs/engineering`
- `docs/backlog`

## Requisitos locales

- Node.js 24+
- `corepack` habilitado
- `pnpm`

## Primer arranque

```bash
corepack enable
corepack prepare pnpm@10.18.3 --activate
pnpm install
pnpm dev
```

## Setup Firebase local

Para probar el flujo real de `Epic 1` hace falta configurar Firebase tanto para API como para web.

### 1. Variables de entorno raíz

Usa `.env.example` como base y crea un `.env` en la raíz:

```bash
cp .env.example .env
```

Completa estas variables con una service account válida de Firebase:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Notas:

- `FIREBASE_PRIVATE_KEY` debe conservar los saltos de línea escapados como `\n`
- `NEXT_PUBLIC_WEB_URL` debe apuntar a `http://localhost:3000`
- `NEXT_PUBLIC_API_URL` debe apuntar a `http://localhost:4000`

### 2. Variables públicas para Next.js

La web necesita exponer `NEXT_PUBLIC_FIREBASE_*` en `apps/web/.env.local`.

```bash
cat <<'EOF' > apps/web/.env.local
NEXT_PUBLIC_APP_NAME=Prode Mundial
NEXT_PUBLIC_WEB_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=replace-me
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=replace-me
NEXT_PUBLIC_FIREBASE_PROJECT_ID=replace-me
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=replace-me
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=replace-me
NEXT_PUBLIC_FIREBASE_APP_ID=replace-me
EOF
```

### 3. Configuración en Firebase Console

- habilitar `Google` en Authentication > Sign-in method
- habilitar `Email link` en Authentication > Sign-in method
- agregar `http://localhost:3000` a los dominios autorizados
- verificar que Firestore esté creado y accesible para el proyecto

### 4. Flujo de prueba recomendado

1. levantar `pnpm dev`
2. abrir [http://localhost:3000](http://localhost:3000)
3. entrar por Google o pedir un magic link
4. verificar redirect a `/profile` si el usuario no completó perfil
5. completar nombre visible y confirmar llegada a `/home`

## Troubleshooting auth

- Si Google no abre popup: el navegador probablemente está bloqueando popups.
- Si el magic link no completa: pedir uno nuevo y usar el mismo email con el que se envió.
- Si la landing pública abre pero la API local no está arriba: la web ahora usa un fallback con el bootstrap por defecto para no bloquear DX.
- Si la API devuelve `401` luego de haber iniciado sesión: normalmente significa token vencido o inválido; cerrar sesión y volver a entrar resuelve el caso.

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

## Seed local de World Cup 2026

Para cerrar `Epic 2 / CARD 2`, la API ya tiene un seed reproducible para `teams`, `groups` y `matches` usando el fixture oficial normalizado de FIFA 2026.

Resumen rápido:

```bash
pnpm --filter @prode/api seed:wc2026 -- --dry-run
pnpm --filter @prode/api seed:wc2026
```

Notas:

- el script requiere las credenciales Firebase ya cargadas en `.env`
- `--dry-run` imprime el resumen del seed sin escribir en Firestore
- el seed deja una mezcla útil de estados para desarrollo: partidos `scheduled`, `live` y `finished`

## Estado actual

Este repo ya cubre una porción funcional de `Epic 1`:

- landing pública conectada al bootstrap real
- login con wiring Firebase client listo para Google + magic link
- validación backend de Firebase ID token
- bootstrap de perfil autenticado sobre Firestore
- shell protegido con guards y redirect a completar perfil

Últimos cierres de `Epic 1`:

- manejo UX más robusto para popup cancelado, link expirado y sesión inválida
- tests mínimos reales para auth guard, login view y `401` en API
- fallback de DX en landing pública cuando la API local no responde

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

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

## Estado actual

Este repo ya cubre una porción funcional de `Epic 1`:

- landing pública conectada al bootstrap real
- login con wiring Firebase client listo para Google + magic link
- validación backend de Firebase ID token
- bootstrap de perfil autenticado sobre Firestore
- shell protegido con guards y redirect a completar perfil

Para probar el flujo end-to-end todavía hace falta cargar credenciales Firebase válidas en `.env`.

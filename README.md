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

Este repo contiene el skeleton técnico de `Epic 1`.
Auth real, Firebase wiring productivo, persistencia y flujos funcionales todavía están pendientes.


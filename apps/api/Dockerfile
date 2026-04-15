# syntax=docker/dockerfile:1.7

# ---------- Stage 1: deps ----------
# Instala dependencias del workspace para @prode/api + @prode/shared.
FROM node:22-alpine AS deps
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# Manifests del workspace (copiamos todo para que pnpm resuelva el grafo completo).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/jobs/package.json apps/jobs/
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY packages/config/package.json packages/config/

# Instalamos solo las deps necesarias para correr el API.
RUN pnpm install --frozen-lockfile --filter @prode/api... --filter @prode/shared...

# ---------- Stage 2: runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /repo

ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

# Copiamos node_modules instalados y el código fuente necesario.
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules

COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Usuario no-root por seguridad.
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /repo
USER app

# Cloud Run inyecta PORT; la app lo lee como fallback de API_PORT.
EXPOSE 8080
ENV PORT=8080

WORKDIR /repo/apps/api
# Corremos TypeScript directo con el loader de tsx (sin pnpm/corepack en runtime).
CMD ["node", "--import", "tsx", "src/index.ts"]

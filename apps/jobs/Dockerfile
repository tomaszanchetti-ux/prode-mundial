# syntax=docker/dockerfile:1.7

# ---------- Stage 1: deps ----------
# Instala dependencias del workspace para @prode/jobs + @prode/shared.
FROM node:22-alpine AS deps
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/jobs/package.json apps/jobs/
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY packages/config/package.json packages/config/

# @prode/api entra en la imagen porque los jobs score-macro / rebuild-macro
# importan el batch de scoring macro desde apps/api (ver run-score-macro-job.ts).
# Sin esto el job muere con "Cannot find module .../score-macro-batch".
RUN pnpm install --frozen-lockfile --filter @prode/jobs... --filter @prode/shared... --filter @prode/api...

# ---------- Stage 2: runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /repo

ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/jobs/node_modules ./apps/jobs/node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules

COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/jobs ./apps/jobs
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /repo
USER app

# Job one-shot: Cloud Run Jobs ejecuta el container, corre el runner y sale.
# JOB_NAME se inyecta por Cloud Scheduler / invocación manual:
#   match-lock-enforcement | score-macro | match-result-sync | rebuild-macro
WORKDIR /repo/apps/jobs
CMD ["node", "--import", "tsx", "src/index.ts"]

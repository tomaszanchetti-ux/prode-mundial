# Prode Mundial — WS39 (FASE 1E · Deploy GCP)

**Fecha:** 2026-04-15
**Branch:** `epic/10-deploy-gcp`
**EPIC:** 10 — Deploy a Google Cloud Platform
**Estado:** Deploy completo ✅ · pendiente merge a `main`

---

## Objetivo de la sesión

Sacar Prode Mundial de "funciona local" a **producción desplegada en GCP**, cubriendo web (Next 16 SSR), API (Express 5), jobs programados (cron) y secretos.

## Arquitectura desplegada

```
┌─────────────────────────────────────────────────────────────────┐
│                         GCP project                             │
│                   prode-mundial-4e419                           │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────────┐      │
│  │ Firebase         │  HTTPS  │ Cloud Run                │      │
│  │ App Hosting      ├────────>│ prode-api                │      │
│  │ (Next 16 SSR)    │  CORS   │ (Express 5 + firebase-   │      │
│  │ europe-west4     │         │  admin, europe-west1)    │      │
│  └──────────────────┘         └──────────┬───────────────┘      │
│                                          │                      │
│                                          ▼                      │
│                               ┌──────────────────┐              │
│                               │ Secret Manager   │              │
│                               │ 5 secrets        │              │
│                               └──────────────────┘              │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────────┐      │
│  │ Cloud Scheduler  │  cron   │ Cloud Run Jobs           │      │
│  │ 3 schedulers     ├────────>│ 4 jobs (same image, diff │      │
│  │ europe-west1     │         │ JOB_NAME env)            │      │
│  └──────────────────┘         └──────────┬───────────────┘      │
│                                          │                      │
│                                          ▼                      │
│                               ┌──────────────────┐              │
│                               │ Firestore + Auth │              │
│                               └──────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## URLs de producción

| Componente | URL |
|---|---|
| Web | `https://prode-mundial-2026--prode-mundial-4e419.europe-west4.hosted.app` |
| API | `https://prode-api-59331857833.europe-west1.run.app` |
| API (alias) | `https://prode-api-spq7uvt3xa-ew.a.run.app` |

## Cards ejecutadas

### C0 — Discovery & prerequisitos ✅
- Verificación de `gcloud` (logged in), proyecto `prode-mundial-4e419`, billing habilitado.
- Habilitadas 6 APIs: `run`, `cloudbuild`, `cloudscheduler`, `secretmanager`, `artifactregistry`, `firebaseapphosting` (+ `developerconnect` en C6).
- Instalada Firebase CLI `v15.14.0` como binario user-local (`~/.local/bin/firebase`) — PATH persistido en `~/.zprofile`.

### C1 — Dockerfile API ✅
- `apps/api/Dockerfile`: multi-stage `node:22-alpine`.
  - Stage `deps`: install con pnpm workspace filtrado a `@prode/api... + @prode/shared...`.
  - Stage `runtime`: usuario no-root, `node --import tsx src/index.ts` (sin pnpm/corepack en runtime → arranque limpio).
- `apps/api/.dockerignore`: excluye otras apps del workspace y `.env`.
- Smoke test local OK: container bootea, `HTTP 200 /health`.
- Ajuste `apps/api/src/index.ts`: lee `PORT ?? API_PORT` y bindea a `0.0.0.0` (requisito Cloud Run).

### C2 — Dockerfile Jobs ✅
- `apps/jobs/Dockerfile`: mismo patrón, sin EXPOSE.
- Dispatcher por `JOB_NAME` (match-lock-enforcement | score-macro | match-result-sync | rebuild-macro).

### C3 — Secret Manager ✅
- `infra/gcp/secrets.sh`: script idempotente.
- 5 secrets subidos: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (multilínea correctamente conservada), `FOOTBALL_DATA_API_KEY`, `PRODE_ADMIN_EMAILS`.
- `roles/secretmanager.secretAccessor` concedido a `59331857833-compute@developer.gserviceaccount.com` (SA default de Cloud Run).

### C4 — Deploy API ✅
- `infra/gcp/deploy-api.sh`: Artifact Registry → Cloud Build → Cloud Run.
- AR repo `prode` en `europe-west1` (docker format).
- Cloud Build via `gcloud builds submit` con `cloudbuild.yaml` inline (`mktemp`).
- Cloud Run: `--cpu=1 --memory=512Mi --min=0 --max=5 --allow-unauthenticated --timeout=60s`.
- Secrets inyectados con `--set-secrets` desde Secret Manager.
- **Gotcha crítico:** `pnpm-lock.yaml` estaba en `.gitignore` → Cloud Build excluía el lockfile del contexto. Fix: creado `.gcloudignore` que no lo ignora, y removido de `.gitignore` (lockfile ahora trackeado).
- Revision `prode-api-00001-lcj` desplegada con éxito.
- Smoke test prod: `GET /health → 200 {"ok":true,"data":{"status":"ok","service":"api"}}`.

### C5 — CORS API ✅
- Refactor de `apps/api/src/server/app.ts`:
  - Antes: un solo origen vía `NEXT_PUBLIC_WEB_URL`, sin reflejar.
  - Ahora: allowlist CSV vía `PRODE_ALLOWED_ORIGINS`, reflection del `Origin` header (echo back solo si está en la lista) + `Vary: Origin`.
- Deploy script actualizado con delimitador `^@@^` en `--set-env-vars` porque el CSV contiene comas que gcloud parsea mal con el delimitador default.
- Allowlist prod: web App Hosting + `prode-mundial-4e419.web.app` + `prode-mundial-4e419.firebaseapp.com` + `localhost:3000` (dev).
- Verificado con `curl -H "Origin: ..."`: permitido → 200 + header reflejado · no permitido → sin header (browser bloquea) · OPTIONS → 204.

### C6 — Deploy web App Hosting ✅
- `apps/web/apphosting.yaml`: runConfig (512Mi, max 5 inst) + 10 env vars `NEXT_PUBLIC_*` con `availability: [BUILD, RUNTIME]`.
- Sub-cards:
  - **C6a:** creación del yaml + commits (handoff WS38 por separado + commit de toda la infra EPIC 10) + push a GitHub.
  - **C6b:** `firebase apphosting:backends:create`.
    - Región: `europe-west4` (App Hosting no ofrece west1; ~5ms latencia vs API en west1).
    - Gotcha: falló primera vez con "Service account service-X@gcp-sa-devconnect.iam.gserviceaccount.com does not exist". Fix: habilitar `developerconnect.googleapis.com` para que se cree la SA agent, esperar propagación, reintentar.
    - Se aprobaron 2 roles: `roles/secretmanager.admin` para Developer Connect SA (conexión GitHub).
    - Backend creado con nombre `prode-mundial-2026` (el CLI eligió ese nombre, funciona igual).
    - Repo linkeado: `tomaszanchetti-ux/prode-mundial` · branch `epic/10-deploy-gcp` · root `apps/web`.
  - **C6c:** primer rollout OK + smoke tests: `/`, `/login`, `/matches`, `/manifest.webmanifest`, `/sw.js`, `/offline` todos 200.
- **Blocker manual resuelto:** agregado el dominio de App Hosting a "Authorized domains" de Firebase Auth (requerido para Google OAuth).

### C7 — Cloud Run Jobs + Scheduler ✅
- `infra/gcp/deploy-jobs.sh`: buildea la imagen de jobs y crea/actualiza 4 Cloud Run Jobs (uno por `JOB_NAME`).
- Cada job: misma imagen, distinto `JOB_NAME` env, mismos secrets de SM.
- `--task-timeout=300s --max-retries=1 --cpu=1 --memory=512Mi`.
- Smoke test real: `prode-job-match-result-sync` ejecutado manualmente, exit 0, log:
  ```json
  {"jobName":"match-result-sync","ok":true,"summary":{"errors":[],"externalMatchesFetched":0,"matchesScored":0,"matchesUpdated":0,...}}
  ```
  (0 matches porque el Mundial aún no empezó — comportamiento correcto).
- `infra/scheduler/setup-schedulers.sh`: crea SA `prode-scheduler-invoker` con `roles/run.invoker` y 3 schedulers en `europe-west1`, todos con timezone `Europe/Madrid`:
  - `sched-prode-job-match-result-sync` — `*/10 * * * *`
  - `sched-prode-job-match-lock-enforcement` — `*/5 * * * *`
  - `sched-prode-job-score-macro` — `*/30 * * * *`
- `prode-job-rebuild-macro` queda on-demand (sin scheduler).

### C8 — CI/CD GitHub Actions ⏸️
**Deferred — tech debt para WS40.**

Hoy:
- Web deploya auto en push a `epic/10-deploy-gcp` (App Hosting lo maneja).
- API/Jobs: deploy manual con scripts `infra/gcp/deploy-api.sh` / `deploy-jobs.sh`.

Pendiente en WS40:
- Workflow `.github/workflows/deploy-api.yml` y `deploy-jobs.yml` con trigger en push a main (y PRs para los tests).
- Service account GitHub con Workload Identity Federation (más seguro que un JSON key).
- Correr los 29 tests en PRs.

## Archivos creados / modificados

**Nuevos:**
- `.gcloudignore`
- `apps/api/Dockerfile` + `.dockerignore`
- `apps/jobs/Dockerfile` + `.dockerignore`
- `apps/web/apphosting.yaml`
- `infra/gcp/secrets.sh`
- `infra/gcp/deploy-api.sh`
- `infra/gcp/deploy-jobs.sh`
- `infra/scheduler/setup-schedulers.sh`
- `docs/handoff/Prode Mundial_WS38_150426.md` (arrastrado de la sesión anterior)
- `pnpm-lock.yaml` (ahora trackeado)

**Modificados:**
- `.gitignore`: removido `pnpm-lock.yaml` de los patterns ignorados.
- `apps/api/src/index.ts`: bind a `0.0.0.0:$PORT`, fallback `API_PORT`.
- `apps/api/src/server/app.ts`: CORS con allowlist CSV + reflection.

## Gotchas que documentar

1. **pnpm-lock.yaml en `.gitignore`** — extraordinariamente atípico. Fue el primer blocker de Cloud Build. Fix en `.gcloudignore` + destraba en `.gitignore` + commit del lockfile.
2. **`gcloud builds submit --config=-`** (stdin) no es confiable en todas las versiones. Usar `mktemp` siempre.
3. **Cloud Run `--set-env-vars` usa coma como separador**. Si un value tiene comas (CSV de orígenes CORS), usar sintaxis `^DELIM^` de gcloud.
4. **Firebase App Hosting** no está disponible en `europe-west1` (solo en `europe-west4`/`us-central1`/etc.). Cross-region API↔web es ~5ms, irrelevante.
5. **`FIREBASE_PRIVATE_KEY` + `docker --env-file`** → error "DECODER routines::unsupported" porque docker no soporta valores multilínea en env-file. No afecta prod (Secret Manager inyecta con newlines reales).
6. **Developer Connect SA** se crea lazy, hay que habilitar su API y esperar propagación antes de usar App Hosting backend:create.
7. **App Hosting requiere dominio en "Authorized domains" de Firebase Auth** — si no, Google OAuth rechaza el popup con `auth/unauthorized-domain`.

## Costo estimado (pre-launch)

Con todo en `min=0` y uso bajo:
- Cloud Run API: $0-1/mes (cold starts ocasionales).
- Cloud Run Jobs: $0-1/mes (3 schedulers corriendo con 0 workload real).
- App Hosting: $0-2/mes (free tier de Cloud Run + CDN incluido).
- Secret Manager: ~$0.06/mes (5 secrets × 6 accesses × free tier generoso).
- Cloud Scheduler: gratis bajo 3 jobs (estamos justo con 3).
- Firestore: free tier sobrado.
- **Total:** probablemente $0-5/mes hasta que haya tráfico real.

## Próxima sesión (WS40)

**Opciones por prioridad:**

1. **Smoke test e2e humano + ajustes** — probar login, picks, leagues en el browser; fixear lo que aparezca.
2. **C8 tech-debt** — montar GH Actions para deploys auto de API/Jobs y correr tests en PRs.
3. **Custom domain** — comprar `.xyz` o similar y apuntarlo a App Hosting (5 min).
4. **Observabilidad** — dashboard en Google Cloud Monitoring con métricas de API latency, error rate, job runs.

Recomiendo 1 → 2 → 3 → 4 en ese orden.

## Referencias

- **Deploy API manual:** `./infra/gcp/deploy-api.sh`
- **Deploy Jobs manual:** `./infra/gcp/deploy-jobs.sh`
- **Ver logs API:** `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=prode-api" --project=prode-mundial-4e419 --limit=20`
- **Ejecutar job on-demand:** `gcloud run jobs execute prode-job-<name> --region=europe-west1 --project=prode-mundial-4e419`
- **Forzar nuevo rollout web:** `git commit` + `git push origin epic/10-deploy-gcp` (App Hosting auto-deploya).
- **Consola App Hosting:** https://console.firebase.google.com/project/prode-mundial-4e419/apphosting
- **Consola Cloud Run:** https://console.cloud.google.com/run?project=prode-mundial-4e419
- **Consola Scheduler:** https://console.cloud.google.com/cloudscheduler?project=prode-mundial-4e419

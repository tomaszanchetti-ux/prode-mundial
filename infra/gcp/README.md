# Prode Mundial — Infra GCP

Scripts y operaciones del pipeline de backend (API + Jobs) en Google Cloud.

## Índice

- [Componentes](#componentes)
- [Setup inicial (una sola vez)](#setup-inicial-una-sola-vez)
- [Deploy automático (GitHub Actions)](#deploy-automático-github-actions)
- [Deploy manual (fallback / emergencias)](#deploy-manual-fallback--emergencias)
- [Rollback](#rollback)
- [Rotación del Service Account key](#rotación-del-service-account-key)
- [Troubleshooting](#troubleshooting)

---

## Componentes

| Recurso GCP | Nombre | Región | Desplegado por |
|-------------|--------|--------|----------------|
| Cloud Run service | `prode-api` | `europe-west1` | `deploy-api.sh` |
| Cloud Run Job | `prode-job-match-result-sync` | `europe-west1` | `deploy-jobs.sh` |
| Cloud Run Job | `prode-job-score-macro` | `europe-west1` | `deploy-jobs.sh` |
| Cloud Run Job | `prode-job-match-lock-enforcement` | `europe-west1` | `deploy-jobs.sh` |
| Cloud Run Job | `prode-job-rebuild-macro` | `europe-west1` | `deploy-jobs.sh` |
| Artifact Registry repo | `prode` | `europe-west1` | auto (`deploy-*.sh`) |
| Secret Manager secrets | ver [`secrets.sh`](./secrets.sh) | global | `secrets.sh` |

La **web** (`apps/web`) se deploya aparte via **Firebase App Hosting** (push a main dispara build + deploy). No pasa por estos scripts.

---

## Setup inicial (una sola vez)

### 1. Prerequisitos
- `gcloud` CLI autenticado con permisos de IAM admin sobre `prode-mundial-4e419`.
- APIs habilitadas: Cloud Run, Cloud Build, Artifact Registry, Secret Manager.
- Secrets ya subidos con `./infra/gcp/secrets.sh` (usa el `.env` del root).

### 2. Crear la Service Account de CD

```bash
./infra/gcp/setup-cd-sa.sh
```

El script:
1. Crea la SA `github-cd@prode-mundial-4e419.iam.gserviceaccount.com` (idempotente).
2. Le asigna 6 roles (`run.admin`, `cloudbuild.builds.editor`, `artifactregistry.writer`, `iam.serviceAccountUser`, `secretmanager.secretAccessor`, `storage.admin`).
3. Permite que impersone la runtime SA de Cloud Run.
4. Genera un JSON key y lo imprime en stdout.

### 3. Pegar el key en GitHub Secrets

1. Abrir https://github.com/tomaszanchetti-ux/prode-mundial/settings/secrets/actions
2. **New repository secret**
3. Name: `GCP_SA_KEY`
4. Value: pegar el JSON completo que imprimió el script
5. Borrar el archivo local: `rm /tmp/github-cd-key.*.json`

Listo — el próximo push a `main` que toque `apps/api/**` o `apps/jobs/**` deploya solo.

---

## Deploy automático (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

### Flujo

```
push a main
    ↓
[validate]  → typecheck + build + test (falla rojo si algo rompe)
    ↓
[changes]   → detecta qué paths cambiaron (dorny/paths-filter)
    ↓
[deploy-api] ← si cambió apps/api/**, packages/**, deploy-api.sh, o ci.yml
[deploy-jobs] ← si cambió apps/jobs/**, packages/**, deploy-jobs.sh, o ci.yml
    ↓
smoke test GET $API_URL/health (reintenta 5 veces con backoff)
```

### Qué NO dispara deploy

- Push a branches que no sean `main`.
- PRs (nunca deployan, solo validan).
- Cambios solo en `apps/web/**`, docs, o archivos fuera de los paths filter.

### Dónde ver el estado

https://github.com/tomaszanchetti-ux/prode-mundial/actions

---

## Deploy manual (fallback / emergencias)

Si GitHub Actions está caído, o para probar un branch sin mergear:

```bash
# API
./infra/gcp/deploy-api.sh

# Jobs (los 4 al mismo tiempo)
./infra/gcp/deploy-jobs.sh
```

Requiere `gcloud` autenticado localmente con permisos equivalentes a la SA de CD.

---

## Rollback

Cloud Run guarda todas las revisiones anteriores. Rollback = redirigir tráfico a una revisión previa.

### 1. Listar revisiones disponibles

```bash
gcloud run revisions list \
  --service=prode-api \
  --project=prode-mundial-4e419 \
  --region=europe-west1 \
  --limit=10
```

Output típico:
```
REVISION                   ACTIVE  SERVICE    DEPLOYED
prode-api-00042-abc         yes    prode-api  2026-04-18 14:23
prode-api-00041-xyz                prode-api  2026-04-18 10:11
prode-api-00040-qwe                prode-api  2026-04-17 18:45
```

### 2. Redirigir tráfico a la revisión anterior

```bash
gcloud run services update-traffic prode-api \
  --project=prode-mundial-4e419 \
  --region=europe-west1 \
  --to-revisions=prode-api-00041-xyz=100
```

Esto es **instantáneo** (no requiere redeploy). Cloud Run hace el swap.

### 3. Verificar

```bash
curl -sSf https://prode-api-59331857833.europe-west1.run.app/health
```

### Rollback de Jobs

Los Cloud Run Jobs no tienen tráfico (son one-shot). Para revertir un job hay que redeployar la imagen anterior:

```bash
# Listar imágenes en Artifact Registry
gcloud artifacts docker images list \
  europe-west1-docker.pkg.dev/prode-mundial-4e419/prode/prode-jobs \
  --limit=10 --sort-by=~CREATE_TIME

# Actualizar el job a una imagen anterior
gcloud run jobs update prode-job-match-result-sync \
  --project=prode-mundial-4e419 \
  --region=europe-west1 \
  --image=europe-west1-docker.pkg.dev/prode-mundial-4e419/prode/prode-jobs:20260417-181234
```

---

## Rotación del Service Account key

**Frecuencia recomendada:** cada 3 meses.

1. Re-ejecutar `./infra/gcp/setup-cd-sa.sh` (genera key nuevo, la SA no se recrea).
2. Actualizar `GCP_SA_KEY` en GitHub Secrets con el nuevo JSON.
3. Borrar keys viejos:
   ```bash
   gcloud iam service-accounts keys list \
     --iam-account=github-cd@prode-mundial-4e419.iam.gserviceaccount.com

   gcloud iam service-accounts keys delete <KEY_ID> \
     --iam-account=github-cd@prode-mundial-4e419.iam.gserviceaccount.com
   ```

---

## Troubleshooting

### El job `deploy-api` falla con 403 / permission denied
- Verificar que `GCP_SA_KEY` esté seteado en GitHub Secrets.
- Verificar que la SA tenga los 6 roles: `gcloud projects get-iam-policy prode-mundial-4e419 --flatten=bindings --filter='bindings.members:github-cd@*'`

### El smoke test falla con 502 / 503
- Cold start puede tardar hasta ~30s en el primer hit (Node + Firebase Admin init). El retry loop cubre ~40s. Si sigue fallando, ver logs de Cloud Run:
  ```bash
  gcloud logging read \
    'resource.type=cloud_run_revision AND resource.labels.service_name=prode-api' \
    --project=prode-mundial-4e419 \
    --limit=50 \
    --format='value(timestamp,severity,textPayload)'
  ```

### El workflow `changes` no detecta cambios correctamente
- `dorny/paths-filter@v3` compara contra el commit anterior en la misma branch. Si el push incluye múltiples commits, revisa el contexto del push.
- Para forzar un deploy, tocá el archivo `ci.yml` (está en los paths filter de ambos jobs).

### Necesito deployar solo API sin jobs (o viceversa)
- Por ahora el workflow no soporta split manual. Hacelo con el script directo:
  ```bash
  ./infra/gcp/deploy-api.sh
  ```

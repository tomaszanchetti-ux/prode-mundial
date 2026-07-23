#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Builda y deploya @prode/jobs a Cloud Run Jobs.
#
# Para cada JOB_NAME del dispatcher (apps/jobs/src/index.ts) creamos un
# Cloud Run Job distinto, todos compartiendo la misma imagen pero con el
# env var JOB_NAME seteado distinto.
#
# Uso:
#   ./infra/gcp/deploy-jobs.sh
#
# Requisitos: APIs habilitadas, secrets ya subidos (C3).
# -----------------------------------------------------------------------------
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-prode-mundial-4e419}"
REGION="${REGION:-europe-west1}"
AR_REPO="${AR_REPO:-prode}"
IMAGE_NAME="${IMAGE_NAME:-prode-jobs}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${IMAGE_NAME}:${IMAGE_TAG}"
# Requerido por los jobs score-macro / rebuild-macro (scoring de picks macro).
# Sin esta var el job aborta con "Missing required environment variable: TOURNAMENT_ID".
TOURNAMENT_ID="${TOURNAMENT_ID:-wc2026}"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

JOBS=(
  "match-result-sync"
  "score-macro"
  "match-lock-enforcement"
  "rebuild-macro"
  "fcm-reminders"
  "bracket-hydration"
)

echo "📦 Proyecto: $PROJECT_ID"
echo "🏷️  Imagen:   $IMAGE_URI"
echo "🏆 Torneo:   $TOURNAMENT_ID"
echo ""

# 1. Build con Cloud Build.
echo "🔨 Submitting Cloud Build..."
cd "$REPO_ROOT"

CLOUDBUILD_TMP="$(mktemp -t cloudbuild-jobs.XXXXXX.yaml)"
trap 'rm -f "$CLOUDBUILD_TMP"' EXIT

cat > "$CLOUDBUILD_TMP" <<EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'apps/jobs/Dockerfile', '-t', '${IMAGE_URI}', '.']
images:
  - '${IMAGE_URI}'
options:
  logging: CLOUD_LOGGING_ONLY
EOF

gcloud builds submit \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --config="$CLOUDBUILD_TMP"

# 2. Deploy / update Cloud Run Job por cada JOB_NAME.
for job in "${JOBS[@]}"; do
  job_resource="prode-job-${job}"
  echo ""
  echo "🚀 Deploying Cloud Run Job '${job_resource}' (JOB_NAME=${job})..."

  if gcloud run jobs describe "$job_resource" \
        --project="$PROJECT_ID" --region="$REGION" >/dev/null 2>&1; then
    # Update existente.
    gcloud run jobs update "$job_resource" \
      --project="$PROJECT_ID" \
      --region="$REGION" \
      --image="$IMAGE_URI" \
      --set-env-vars="NODE_ENV=production,JOB_NAME=${job},TOURNAMENT_ID=${TOURNAMENT_ID}" \
      --set-secrets="FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FOOTBALL_DATA_API_KEY=FOOTBALL_DATA_API_KEY:latest,PRODE_ADMIN_EMAILS=PRODE_ADMIN_EMAILS:latest" \
      --cpu=1 \
      --memory=512Mi \
      --max-retries=1 \
      --task-timeout=300s \
      >/dev/null
  else
    # Create nuevo.
    gcloud run jobs create "$job_resource" \
      --project="$PROJECT_ID" \
      --region="$REGION" \
      --image="$IMAGE_URI" \
      --set-env-vars="NODE_ENV=production,JOB_NAME=${job},TOURNAMENT_ID=${TOURNAMENT_ID}" \
      --set-secrets="FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FOOTBALL_DATA_API_KEY=FOOTBALL_DATA_API_KEY:latest,PRODE_ADMIN_EMAILS=PRODE_ADMIN_EMAILS:latest" \
      --cpu=1 \
      --memory=512Mi \
      --max-retries=1 \
      --task-timeout=300s \
      >/dev/null
  fi

  echo "  ✅ ${job_resource} listo."
done

echo ""
echo "✅ Todos los Cloud Run Jobs desplegados."
echo ""
echo "Para ejecutar un job manualmente:"
echo "  gcloud run jobs execute prode-job-match-result-sync --region=$REGION --project=$PROJECT_ID"

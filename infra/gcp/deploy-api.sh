#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Builda y deploya @prode/api a Cloud Run.
#
# Flujo:
#   1. Asegura el repo de Artifact Registry.
#   2. Submite build a Cloud Build (usa apps/api/Dockerfile).
#   3. Deploya a Cloud Run con secrets inyectados desde Secret Manager.
#
# Uso:
#   ./infra/gcp/deploy-api.sh
#
# Requisitos: gcloud autenticado, APIs habilitadas, secrets ya subidos (C3).
# -----------------------------------------------------------------------------
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-prode-mundial-4e419}"
REGION="${REGION:-europe-west1}"
AR_REPO="${AR_REPO:-prode}"
SERVICE_NAME="${SERVICE_NAME:-prode-api}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE_NAME}:${IMAGE_TAG}"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "📦 Proyecto: $PROJECT_ID"
echo "📍 Región:  $REGION"
echo "🏷️  Imagen:  $IMAGE_URI"
echo ""

# 1. Artifact Registry — crea el repo si no existe.
if ! gcloud artifacts repositories describe "$AR_REPO" \
      --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "🗂️  Creando Artifact Registry repo '$AR_REPO'..."
  gcloud artifacts repositories create "$AR_REPO" \
    --project="$PROJECT_ID" \
    --location="$REGION" \
    --repository-format=docker \
    --description="Prode Mundial container images"
else
  echo "🗂️  Artifact Registry repo '$AR_REPO' ya existe."
fi

# 2. Cloud Build — builda y pushea la imagen.
echo ""
echo "🔨 Submitting Cloud Build..."
cd "$REPO_ROOT"

CLOUDBUILD_TMP="$(mktemp -t cloudbuild-api.XXXXXX.yaml)"
trap 'rm -f "$CLOUDBUILD_TMP"' EXIT

cat > "$CLOUDBUILD_TMP" <<EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'apps/api/Dockerfile', '-t', '${IMAGE_URI}', '.']
images:
  - '${IMAGE_URI}'
options:
  logging: CLOUD_LOGGING_ONLY
EOF

gcloud builds submit \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --config="$CLOUDBUILD_TMP"

# 3. Cloud Run — deploya el servicio.
echo ""
echo "🚀 Deploying Cloud Run service '$SERVICE_NAME'..."
gcloud run deploy "$SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="$IMAGE_URI" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=60s \
  --set-env-vars="^@@^NODE_ENV=production@@PRODE_ALLOWED_ORIGINS=${PRODE_ALLOWED_ORIGINS:-https://app.prodemundial.org,https://prodemundial.org,https://prode-mundial-2026--prode-mundial-4e419.europe-west4.hosted.app,https://prode-mundial-4e419.web.app,https://prode-mundial-4e419.firebaseapp.com,http://localhost:3000}" \
  --set-secrets="FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FOOTBALL_DATA_API_KEY=FOOTBALL_DATA_API_KEY:latest,PRODE_ADMIN_EMAILS=PRODE_ADMIN_EMAILS:latest"

URL="$(gcloud run services describe "$SERVICE_NAME" \
  --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"

echo ""
echo "✅ API desplegada: $URL"
echo ""
echo "Smoke test:"
echo "  curl -sS -o /dev/null -w 'HTTP %{http_code}\\n' $URL/"
echo "  curl -sS $URL/health 2>/dev/null || curl -sS $URL/"

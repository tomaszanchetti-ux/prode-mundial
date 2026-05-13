#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Sube / actualiza secrets en Google Secret Manager a partir del .env del repo.
#
# Idempotente: si el secret existe, crea una nueva versión; si no, lo crea.
# Concede rol `roles/secretmanager.secretAccessor` a la service account default
# de Cloud Run (usada por el API y los Jobs).
#
# Uso:
#   ./infra/gcp/secrets.sh                 # usa .env del repo root
#   ENV_FILE=path/to/.env ./infra/gcp/secrets.sh
#
# Requisitos: gcloud autenticado, proyecto seteado, API secretmanager habilitada.
# -----------------------------------------------------------------------------
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-prode-mundial-4e419}"
ENV_FILE="${ENV_FILE:-$(cd "$(dirname "$0")/../.." && pwd)/.env}"
REGION="${REGION:-europe-west1}"

# Secrets sensibles que sí van a Secret Manager.
# El resto del .env (NEXT_PUBLIC_*, NODE_ENV, etc.) se inyecta como env vars
# planas en Cloud Run / App Hosting, no son confidenciales.
SECRETS=(
  "FIREBASE_PROJECT_ID"
  "FIREBASE_CLIENT_EMAIL"
  "FIREBASE_PRIVATE_KEY"
  "FOOTBALL_DATA_API_KEY"
  "PRODE_ADMIN_EMAILS"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ No se encontró ENV_FILE: $ENV_FILE" >&2
  exit 1
fi

echo "🔐 Proyecto: $PROJECT_ID"
echo "📄 Env file: $ENV_FILE"
echo "📍 Región:  $REGION"
echo ""

# Lee un valor del .env respetando comillas simples/dobles y manteniendo
# literales \n (para FIREBASE_PRIVATE_KEY, que se guarda multilínea real).
read_env_value() {
  local key="$1"
  # Extrae "KEY=value" eliminando comillas envolventes.
  local raw
  raw="$(grep -E "^${key}=" "$ENV_FILE" | head -1 | sed -E "s/^${key}=//")"
  # Remueve comillas dobles o simples envolventes si existen.
  if [[ "$raw" =~ ^\"(.*)\"$ ]]; then
    raw="${BASH_REMATCH[1]}"
  elif [[ "$raw" =~ ^\'(.*)\'$ ]]; then
    raw="${BASH_REMATCH[1]}"
  fi
  # Convierte \n literales a newlines reales (necesario para FIREBASE_PRIVATE_KEY).
  printf '%b' "$raw"
}

upsert_secret() {
  local name="$1"
  local value="$2"

  if gcloud secrets describe "$name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "  → $name existe. Creando nueva versión..."
    printf '%s' "$value" | gcloud secrets versions add "$name" \
      --project="$PROJECT_ID" \
      --data-file=- >/dev/null
  else
    echo "  → $name no existe. Creándolo..."
    printf '%s' "$value" | gcloud secrets create "$name" \
      --project="$PROJECT_ID" \
      --replication-policy=automatic \
      --data-file=- >/dev/null
  fi
}

for key in "${SECRETS[@]}"; do
  value="$(read_env_value "$key")"
  if [[ -z "$value" ]]; then
    echo "⚠️  $key está vacío en $ENV_FILE — salteado." >&2
    continue
  fi
  upsert_secret "$key" "$value"
done

echo ""
echo "🔑 Concediendo secretAccessor a la service account de Cloud Run..."

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for key in "${SECRETS[@]}"; do
  gcloud secrets add-iam-policy-binding "$key" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:${CLOUD_RUN_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None \
    >/dev/null 2>&1 || true
done

echo ""
echo "✅ Listo. Secrets disponibles para ${CLOUD_RUN_SA}."
echo ""
echo "Para verificar:"
echo "  gcloud secrets list --project=$PROJECT_ID"
echo "  gcloud secrets versions access latest --secret=FIREBASE_PROJECT_ID --project=$PROJECT_ID"

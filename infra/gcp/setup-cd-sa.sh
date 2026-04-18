#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Crea la Service Account que usa GitHub Actions para deployar API + Jobs.
#
# Idempotente: si la SA o los bindings ya existen, los deja como están.
# Genera un JSON key al final y lo imprime para pegar en GitHub Secrets.
#
# Uso:
#   ./infra/gcp/setup-cd-sa.sh
#
# Requisitos: gcloud autenticado con permisos de IAM admin sobre el proyecto.
# Correr UNA sola vez al arrancar la automatización.
# -----------------------------------------------------------------------------
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-prode-mundial-4e419}"
SA_NAME="${SA_NAME:-github-cd}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_OUTPUT="${KEY_OUTPUT:-$(mktemp -t github-cd-key.XXXXXX.json)}"

ROLES=(
  "roles/run.admin"
  "roles/cloudbuild.builds.editor"
  "roles/artifactregistry.writer"
  "roles/iam.serviceAccountUser"
  "roles/secretmanager.secretAccessor"
  "roles/storage.admin"
)

echo "📦 Proyecto:       $PROJECT_ID"
echo "👤 Service Account: $SA_EMAIL"
echo ""

# 1. Crear la SA si no existe.
if gcloud iam service-accounts describe "$SA_EMAIL" \
      --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "✔️  Service Account ya existe."
else
  echo "🆕 Creando Service Account..."
  gcloud iam service-accounts create "$SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="GitHub Actions CD" \
    --description="Usada por GitHub Actions para deployar API y Jobs a Cloud Run"
fi

# 2. Asignar roles a nivel proyecto (idempotente: --condition=None + add hace upsert).
echo ""
echo "🔐 Asignando roles..."
for role in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$role" \
    --condition=None \
    --quiet >/dev/null
  echo "  ✓ $role"
done

# 3. Permitir que la SA impersone la runtime SA de Cloud Run (default compute SA).
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo ""
echo "🎭 Permitiendo impersonar runtime SA ($RUNTIME_SA)..."
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet >/dev/null

# 4. Generar un nuevo JSON key.
echo ""
echo "🔑 Generando JSON key en $KEY_OUTPUT..."
gcloud iam service-accounts keys create "$KEY_OUTPUT" \
  --project="$PROJECT_ID" \
  --iam-account="$SA_EMAIL"

echo ""
echo "✅ Setup completo."
echo ""
echo "=============================================================="
echo "  SIGUIENTE PASO — pegar el contenido del JSON en GitHub:"
echo "=============================================================="
echo ""
echo "  1. Abrir: https://github.com/tomaszanchetti-ux/prode-mundial/settings/secrets/actions"
echo "  2. 'New repository secret'"
echo "  3. Name:  GCP_SA_KEY"
echo "  4. Value: (pegar el JSON completo de abajo)"
echo ""
echo "--- JSON KEY (copiar TODO, incluidas las llaves) ---"
cat "$KEY_OUTPUT"
echo ""
echo "--- FIN JSON KEY ---"
echo ""
echo "⚠️  Después de copiar, borrar el archivo local:"
echo "    rm $KEY_OUTPUT"
echo ""
echo "🔁 Rotación recomendada: cada 3 meses."
echo "   Para rotar: re-ejecutar este script y actualizar el secret en GitHub."

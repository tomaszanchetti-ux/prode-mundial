#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Crea Cloud Scheduler jobs que disparan los Cloud Run Jobs en cron.
#
# Crea una SA dedicada 'prode-scheduler-invoker' con roles/run.invoker si
# no existe, y luego crea/actualiza los schedulers.
#
# Uso:
#   ./infra/scheduler/setup-schedulers.sh
# -----------------------------------------------------------------------------
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-prode-mundial-4e419}"
REGION="${REGION:-europe-west1}"
SA_NAME="prode-scheduler-invoker"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

# Crons por job. Frecuencias bajas porque pre-launch del Mundial, todavía
# no hay datos reales. Ajustar al arrancar el torneo.
#   (job_id,cron_expression,description)
SCHEDULES=(
  "prode-job-match-result-sync|*/10 * * * *|Sync de resultados desde football-data.org (cada 10 min)"
  "prode-job-match-lock-enforcement|*/5 * * * *|Bloqueo de picks cuando arrancan los matches (cada 5 min)"
  "prode-job-score-macro|*/30 * * * *|Scoring de picks macro (cada 30 min)"
)

echo "📍 Proyecto: $PROJECT_ID · Región: $REGION"
echo ""

# 1. Crea SA si no existe.
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "👤 Creando service account '$SA_NAME'..."
  gcloud iam service-accounts create "$SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="Prode Scheduler Invoker"
else
  echo "👤 Service account '$SA_NAME' ya existe."
fi

# 2. Otorga roles/run.invoker a nivel proyecto (para disparar cualquier job de Cloud Run).
echo "🔑 Asegurando roles/run.invoker para la SA..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker" \
  --condition=None \
  >/dev/null 2>&1 || true

# 3. Crea/actualiza cada scheduler.
for entry in "${SCHEDULES[@]}"; do
  IFS='|' read -r job_resource cron_expr description <<< "$entry"
  scheduler_name="sched-${job_resource}"
  job_run_url="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/${job_resource}:run"

  echo ""
  echo "⏰ ${scheduler_name}"
  echo "   cron: ${cron_expr}"
  echo "   desc: ${description}"

  if gcloud scheduler jobs describe "$scheduler_name" \
        --project="$PROJECT_ID" --location="$REGION" >/dev/null 2>&1; then
    gcloud scheduler jobs update http "$scheduler_name" \
      --project="$PROJECT_ID" \
      --location="$REGION" \
      --schedule="$cron_expr" \
      --uri="$job_run_url" \
      --http-method=POST \
      --oauth-service-account-email="$SA_EMAIL" \
      --time-zone="Europe/Madrid" \
      --description="$description" \
      >/dev/null
    echo "   ✅ updated."
  else
    gcloud scheduler jobs create http "$scheduler_name" \
      --project="$PROJECT_ID" \
      --location="$REGION" \
      --schedule="$cron_expr" \
      --uri="$job_run_url" \
      --http-method=POST \
      --oauth-service-account-email="$SA_EMAIL" \
      --time-zone="Europe/Madrid" \
      --description="$description" \
      >/dev/null
    echo "   ✅ created."
  fi
done

echo ""
echo "✅ Schedulers listos. Ver en:"
echo "   https://console.cloud.google.com/cloudscheduler?project=$PROJECT_ID"

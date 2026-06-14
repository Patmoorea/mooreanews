#!/usr/bin/env bash
# Veille chainée MooreaNews — même logique que .github/workflows/veille-hourly.yml
# Usage : ./scripts/run-veille-chain.sh
# Prérequis : .env.local avec CRON_SECRET

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -v '^#' .env.local | grep -v '^$' | sed 's/^/export /')
  set +a
fi

if [ -z "${CRON_SECRET:-}" ]; then
  echo "CRON_SECRET manquant dans .env.local"
  exit 1
fi

BASE="${NEXT_PUBLIC_SITE_URL:-https://www.mooreanews.com}"
BASE="${BASE%/}"
LOG="${MOOREA_VEILLE_LOG:-/tmp/moorea-veille.log}"

run_step() {
  local label="$1"
  local endpoint="$2"
  local extra="${3:-}"
  local optional="${4:-0}"
  local max_time="${5:-55}"
  local url="${BASE}${endpoint}?secret=${CRON_SECRET}&wait=1"
  if [ -n "$extra" ]; then
    url="${url}&${extra}"
  fi
  echo ""
  echo "=== $(date '+%Y-%m-%d %H:%M:%S') ${label} ==="
  set +e
  code=$(curl -sS -o /tmp/moorea-veille-step.json -w "%{http_code}" \
    --http1.1 --max-time "$max_time" "$url")
  set -e
  echo "HTTP ${code}"
  head -c 400 /tmp/moorea-veille-step.json 2>/dev/null || true
  echo ""
  if grep -q '"error":"unauthorized"' /tmp/moorea-veille-step.json 2>/dev/null; then
    echo "CRON_SECRET incorrect"
    exit 1
  fi
  if [ "$code" = "200" ] || [ "$code" = "202" ]; then
    return 0
  fi
  if [ "$optional" = "1" ]; then
    echo "Avertissement ${label} — suite"
    return 0
  fi
  echo "Échec ${label} (HTTP ${code})"
  exit 1
}

{
  echo "Veille chainée → ${BASE}"
  run_step "RSS" "/api/cron/aggregate" "part=rss"
  run_step "Facebook" "/api/cron/facebook" "chain=1&limit=6" "1" "50"
  run_step "Web" "/api/cron/aggregate" "part=web"
  run_step "IA brouillons" "/api/cron/aggregate" "part=ai" "1" "55"
  run_step "Finish + Telegram" "/api/cron/aggregate" "part=finish"
  echo ""
  echo "✓ Veille terminée $(date '+%Y-%m-%d %H:%M:%S')"
} >> "$LOG" 2>&1

echo "Log : $LOG"

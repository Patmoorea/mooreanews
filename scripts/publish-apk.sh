#!/usr/bin/env bash
# Compile l’APK Android et le copie dans public/downloads/ pour le site.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/mooreanews-app"
OUT="$ROOT/public/downloads/mooreanews.apk"

export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 17 2>/dev/null || true)}"
if [[ -z "$JAVA_HOME" ]]; then
  echo "Erreur: Java 17 requis."
  exit 1
fi

"$APP/scripts/build-android.sh"
mkdir -p "$(dirname "$OUT")"
cp "$APP/android/app/build/outputs/apk/debug/app-debug.apk" "$OUT"
echo ""
echo "APK en ligne : public/downloads/mooreanews.apk"
echo "URL : https://www.mooreanews.com/downloads/mooreanews.apk"
ls -lh "$OUT"

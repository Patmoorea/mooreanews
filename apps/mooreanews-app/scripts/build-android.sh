#!/usr/bin/env bash
# Build APK debug MooreaNews — Java 17 (Capacitor forcé en release 17)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then
  npm install
fi
npx cap sync android

export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 17 2>/dev/null || true)}"
if [[ -z "$JAVA_HOME" ]]; then
  echo "Erreur: Java 17 requis. Installez Temurin 17 ou définissez JAVA_HOME."
  exit 1
fi
echo "JAVA_HOME=$JAVA_HOME"

cd android
./gradlew assembleDebug
echo ""
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"

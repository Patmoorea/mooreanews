#!/usr/bin/env bash
# APK / AAB release signé — Play Store ou installation directe
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FORMAT="${1:-apk}" # apk | aab

if [[ ! -d node_modules ]]; then npm install; fi
npx cap sync android

export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 17 2>/dev/null || true)}"
if [[ -z "$JAVA_HOME" ]]; then
  echo "Erreur: Java 17 requis."
  exit 1
fi

KEYSTORE="$ROOT/android/mooreanews-release.keystore"
PROPS="$ROOT/android/keystore.properties"

if [[ ! -f "$PROPS" ]]; then
  echo "=== Première fois : créer le keystore de signature ==="
  echo ""
  echo "  keytool -genkey -v -keystore android/mooreanews-release.keystore \\"
  echo "    -alias mooreanews -keyalg RSA -keysize 2048 -validity 10000"
  echo ""
  echo "Puis créer android/keystore.properties :"
  echo "  storePassword=VOTRE_MDP"
  echo "  keyPassword=VOTRE_MDP"
  echo "  keyAlias=mooreanews"
  echo "  storeFile=mooreanews-release.keystore"
  echo ""
  cp -n "$ROOT/android/keystore.properties.example" "$PROPS" 2>/dev/null || true
  if [[ ! -f "$PROPS" ]]; then exit 1; fi
fi

cd android
if [[ "$FORMAT" == "aab" ]]; then
  ./gradlew bundleRelease
  echo ""
  echo "AAB Play Store: app/build/outputs/bundle/release/app-release.aab"
else
  ./gradlew assembleRelease
  echo ""
  echo "APK release: app/build/outputs/apk/release/app-release.apk"
fi

#!/usr/bin/env bash
# Prépare le projet iOS et ouvre Xcode (IPA / App Store)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then npm install; fi
npx cap sync ios

if ! xcode-select -p 2>/dev/null | grep -q "Xcode.app"; then
  echo ""
  echo "⚠️  Xcode complet requis (pas seulement Command Line Tools)."
  echo "   Installez Xcode depuis l’App Store, puis :"
  echo "   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  echo ""
fi

if command -v pod >/dev/null; then
  (cd ios/App && pod install) || echo "pod install échoué — ouvrez Xcode après installation Xcode."
fi

echo ""
echo "=== Ouvrir dans Xcode ==="
echo "  open ios/App/App.xcworkspace"
echo ""
echo "Dans Xcode :"
echo "  1. Signing & Capabilities → Team (compte Apple Developer)"
echo "  2. Product → Archive → Distribute App"
echo "  3. App Store ou Ad Hoc (IPA installable sur iPhone)"
echo ""

npx cap open ios 2>/dev/null || open "$ROOT/ios/App/App.xcworkspace" 2>/dev/null || open "$ROOT/ios/App/App.xcodeproj"

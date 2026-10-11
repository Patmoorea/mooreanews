#!/usr/bin/env bash
# Installe l’agent IA MooreaNews (Ollama local) en LaunchAgent macOS.
# Passage toutes les 2 h de 6h à 20h (heure du Mac = Pacific/Tahiti), à hh:20.
#
# Usage : bash scripts/install-ai-veille-launchd.sh [/chemin/moorea-hub] [modèle]
# Désinstaller : launchctl bootout gui/$(id -u)/com.mooreanews.ai-veille
#                rm ~/Library/LaunchAgents/com.mooreanews.ai-veille.plist
#
# Brouillons uniquement par défaut (Admin → Articles, tag ai-draft).
# Publication auto si l’IA juge l’info Moorea : AI_VEILLE_AUTO_PUBLISH=true
# dans .env.local.
set -euo pipefail

HUB="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
MODEL="${2:-qwen2.5:14b}"
LABEL="com.mooreanews.ai-veille"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG="$HOME/Library/Logs/mooreanews-ai-veille.log"
NODE_BIN="$(dirname "$(command -v node)")"

[ -f "$HUB/.env.local" ] || { echo "Manque $HUB/.env.local"; exit 1; }
[ -x "$HUB/node_modules/.bin/tsx" ] || { echo "Lancez npm ci dans $HUB"; exit 1; }

hours=""
for h in 6 8 10 12 14 16 18 20; do
  hours+="    <dict><key>Hour</key><integer>${h}</integer><key>Minute</key><integer>20</integer></dict>
"
done

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${HUB}/node_modules/.bin/tsx</string>
    <string>${HUB}/scripts/run-ai-moorea.ts</string>
  </array>
  <key>WorkingDirectory</key><string>${HUB}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>${NODE_BIN}:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>OLLAMA_API_URL</key><string>http://127.0.0.1:11434</string>
    <key>OLLAMA_MODEL</key><string>${MODEL}</string>
    <key>OLLAMA_KEEP_ALIVE</key><string>2m</string>
  </dict>
  <key>StartCalendarInterval</key>
  <array>
${hours}  </array>
  <key>RunAtLoad</key><false/>
  <key>LowPriorityIO</key><true/>
  <key>Nice</key><integer>10</integer>
  <key>StandardOutPath</key><string>${LOG}</string>
  <key>StandardErrorPath</key><string>${LOG}</string>
</dict>
</plist>
PLIST

plutil -lint "$PLIST"
launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "OK — ${LABEL} (${MODEL}) · log : ${LOG}"
echo "Test immédiat : launchctl kickstart gui/$(id -u)/${LABEL}"

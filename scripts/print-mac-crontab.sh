#!/usr/bin/env bash
# Affiche le crontab recommandé pour MooreaNews (Mac, fuseau Tahiti).
# Ne modifie rien automatiquement — copiez/collez dans : crontab -e
#
# Prérequis :
#   - Mac réglé sur fuseau « Pacific/Tahiti » (Réglages → Général → Date et heure)
#   - .env.local avec CRON_SECRET dans ~/Desktop/moorea-hub
#   - chmod +x scripts/run-veille-chain.sh
#
# Si vous activez le crontab Mac, DÉSACTIVEZ GitHub Actions (veille-hourly.yml)
# pour éviter double veille → double facturation Vercel.

HUB="/Users/patricejourdan/Desktop/moorea-hub"
NODE="$(command -v node || echo /usr/local/bin/node)"
NPM="$(command -v npm || echo /usr/local/bin/npm)"

cat <<EOF
# === MooreaNews — crons Mac (heure Tahiti si le Mac est en Pacific/Tahiti) ===

# Veille RSS + Facebook + web (5h–20h, toutes les heures)
0 5-20 * * * cd ${HUB} && /bin/bash scripts/run-veille-chain.sh

# Surveillance site + auto-fix veille/coupures (toutes les 5 min)
*/5 * * * * cd ${HUB} && ${NPM} run watch:site -- --fix >> /tmp/moorea-watch.log 2>&1

# Job quotidien complet (6h05 — doublon optionnel si Vercel Hobby cron actif)
# 5 6 * * * curl -fsS "https://www.mooreanews.com/api/cron/daily?secret=\$(grep CRON_SECRET ${HUB}/.env.local | cut -d= -f2-)" >> /tmp/moorea-daily.log 2>&1

# Météo vigilance après-midi (~15h)
5 15 * * * curl -fsS --max-time 55 "https://www.mooreanews.com/api/cron/meteo-vigilance?secret=\$(grep ^CRON_SECRET= ${HUB}/.env.local | cut -d= -f2- | tr -d '\"')" >> /tmp/moorea-meteo.log 2>&1

# Push digest soir (jeu–dim ~17h)
0 17 * * 4,5,6,0 curl -fsS --max-time 55 "https://www.mooreanews.com/api/cron/evening-push?secret=\$(grep ^CRON_SECRET= ${HUB}/.env.local | cut -d= -f2- | tr -d '\"')" >> /tmp/moorea-evening.log 2>&1

# Newsletter dimanche ~18h
0 18 * * 0 curl -fsS --max-time 300 "https://www.mooreanews.com/api/cron/weekly-newsletter?secret=\$(grep ^CRON_SECRET= ${HUB}/.env.local | cut -d= -f2- | tr -d '\"')&wait=1" >> /tmp/moorea-newsletter.log 2>&1

# IA locale Ollama (optionnel, 5h–20h)
# 0 5-20 * * * cd ${HUB} && ${NPM} run ai:moorea >> /tmp/moorea-ai.log 2>&1

EOF

echo ""
echo "→ Copier les lignes ci-dessus, puis : crontab -e"
echo "→ Vérifier : crontab -l"
echo "→ Logs : /tmp/moorea-*.log"
echo "→ Désactiver GitHub Actions si vous utilisez le Mac (Settings → Actions → Disable workflow)"

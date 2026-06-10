# Surveillance OpenClaw — MooreaNews

Surveiller le site prod depuis votre Mac (OpenClaw, cron, Automator) avec alertes Telegram — comme vos bots de trading.

## Prérequis

Dans `.env.local` (mêmes valeurs que Vercel si possible) :

| Variable | Usage |
|----------|--------|
| `TELEGRAM_BOT_TOKEN` | alertes admin |
| `TELEGRAM_CHAT_ID` | votre chat |
| `CRON_SECRET` | optionnel — auto-fix veille/coupures |
| `NEXT_PUBLIC_SITE_URL` | défaut `https://www.mooreanews.com` |

## Test manuel

```bash
npm run watch:site
npm run watch:site -- --fix
```

Exit `0` = OK, `1` = problème (Telegram envoyé si configuré).

## Endpoint santé (prod)

Après déploiement :

```text
GET https://www.mooreanews.com/api/health
GET https://www.mooreanews.com/api/health?secret=VOTRE_CRON_SECRET
```

Réponse `503` si une page publique renvoie HTTP ≥ 500.

## OpenClaw — automation recommandée

Créez une automation OpenClaw (toutes les **5 minutes**) :

**Commande :**

```bash
cd /Users/patricejourdan/Desktop/moorea-hub && npm run watch:site -- --fix
```

**Si exit code ≠ 0** (échec), prompt agent OpenClaw :

```text
MooreaNews est en panne. Lis la sortie du script watch:site.
Si HTTP 500 sur / : ouvre le repo moorea-hub, vérifie les derniers commits et les logs Vercel, propose un fix.
Ne push pas sans mon accord. Résume sur Telegram ce que tu as trouvé.
```

## Ce que l’auto-fix peut / ne peut pas faire

| Problème | Auto (`--fix`) | Telegram |
|----------|----------------|----------|
| Page accueil HTTP 500 (bug React/SSR) | ❌ | ✅ alerte + « ouvrir Cursor » |
| Coupures / veille pas à jour | ✅ cron utility-outages + aggregate | ✅ |
| Site entièrement down (Vercel) | ❌ | ✅ |
| Token Facebook expiré | ❌ (déjà géré par cron daily) | ✅ via veille existante |

Pour un crash code comme celui du bandeau coupure, **seule une alerte + intervention humaine / agent Cursor** corrige — pas de rollback automatique sans risque.

## Cooldown Telegram

Le script n’envoie pas la même alerte plus d’une fois toutes les **30 minutes** (fichier local `scripts/.openclaw-watch-state.json`).

Quand le site repasse OK, un message « ✅ de nouveau OK » est envoyé.

## macOS cron (sans OpenClaw)

```cron
*/5 * * * * cd /Users/patricejourdan/Desktop/moorea-hub && /usr/bin/env npm run watch:site -- --fix >> /tmp/mooreanews-watch.log 2>&1
```

# Telegram public — @MooreanewsPublic_bot

## Deux bots distincts

| Bot | Variable | Rôle |
|-----|----------|------|
| **Admin** (privé) | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | Veille, erreurs, signalements à modérer → **vous** |
| **Public** | `TELEGRAM_PUBLIC_BOT_TOKEN` | Signalements citoyens (`/start`) + posts canal |

## Configuration Vercel

```
TELEGRAM_PUBLIC_BOT_TOKEN=...        # token @MooreanewsPublic_bot (BotFather)
TELEGRAM_PUBLIC_BOT_USERNAME=MooreanewsPublic_bot
TELEGRAM_WEBHOOK_SECRET=...          # openssl rand -hex 16

TELEGRAM_BOT_TOKEN=...               # bot admin (inchangé)
TELEGRAM_CHAT_ID=...                 # votre chat privé

TELEGRAM_PUBLIC_CHAT_ID=-100...      # canal articles (voir ci-dessous)
TELEGRAM_PUBLIC_CHANNEL_USERNAME=MooreaNews   # optionnel, lien sur le site
```

SQL Supabase : `supabase/signalement-telegram-ai.sql`

## 1. Activer le webhook (bot public)

Après chaque deploy :

```bash
curl "https://www.mooreanews.com/api/cron/telegram-webhook?secret=VOTRE_CRON_SECRET"
```

Réponse attendue : `"ok":true`, `"bot":"@MooreanewsPublic_bot"`

## 2. Canal actualités (articles automatiques)

Les **articles** ne partent pas en DM à tous les abonnés du bot — il faut un **canal** :

1. Telegram → **Nouveau canal** → public → `@MooreaNews` (exemple)
2. Paramètres canal → **Administrateurs** → ajouter **@MooreanewsPublic_bot** (droits poster)
3. Récupérer l’ID du canal (bot @userinfobot ou API) → `TELEGRAM_PUBLIC_CHAT_ID`
4. `TELEGRAM_PUBLIC_CHANNEL_USERNAME=MooreaNews` pour le bouton sur `/signalements`

Le site envoie alors :
- **Digest matin** « Moorea en 30 secondes »
- **Nouveaux articles** après import Facebook **et** veille RSS (titre + lien, max 5/passage)

### Test canal (diagnostic)

```bash
curl "https://www.mooreanews.com/api/cron/telegram-webhook?secret=VOTRE_CRON_SECRET&testChannel=1"
```

Réponse `"channelTest": { "ok": true }` → un message test apparaît sur @MooreaNews.

Erreurs fréquentes :
- `chat not found` → mauvais `TELEGRAM_PUBLIC_CHAT_ID`
- `bot is not a member` / `need administrator rights` → ajouter **@MooreanewsPublic_bot** comme admin du canal avec droit **Publier des messages**

Désactiver les posts articles : `TELEGRAM_PUBLIC_ARTICLE_POSTS=false`

## 3. Signalements citoyens

1. Citoyen ouvre [t.me/MooreanewsPublic_bot](https://t.me/MooreanewsPublic_bot)
2. `/start` → catégorie → description → lieu → photo → contact
3. **Vous** recevez Telegram + email + **Admin → Soumissions**
4. **Approuver** → alerte sur `/alertes` + push quartier

## 4. Lien sur le site

Page [mooreanews.com/signalements](https://www.mooreanews.com/signalements) — bouton « Ouvrir le bot Telegram ».

## Test

```bash
# Aperçu newsletter-style non, preview signalement bot :
# Ouvrir t.me/MooreanewsPublic_bot → /start
```

# Checklist configuration MooreaNews (production)

À faire sur **Vercel → Settings → Environment Variables** (cocher Production + Preview + Development).

## Minimum (formulaires + météo)

| Variable | Exemple |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | `https://mooreanews.com` |
| `OPENWEATHERMAP_API_KEY` | clé [openweathermap.org](https://openweathermap.org/api) |
| `RESEND_API_KEY` | clé Resend |
| `RESEND_FROM` | `MooreaNews <hello@mooreanews.com>` |
| `RESEND_ADMIN` | votre email qui reçoit les messages |
| `TELEGRAM_BOT_TOKEN` | token @BotFather |
| `TELEGRAM_CHAT_ID` | id du chat / groupe |

**Resend :** vérifier le domaine `mooreanews.com` (DNS TXT) sur resend.com.

## Admin + base de données (recommandé)

| Variable | Où la trouver |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | idem (secret) |
| `CRON_SECRET` | `openssl rand -hex 32` |

Puis dans Supabase SQL Editor : exécuter `supabase/schema.sql`, puis en local `npm run seed`.

Promouvoir votre compte admin :

```sql
update public.profiles set role = 'admin' where email = 'votre@email.com';
```

Auth → URL de redirection : `https://mooreanews.com/auth/callback`

## Tests après config

1. `/soumettre` → email + Telegram reçus  
2. `/contact` → email reçu  
3. Newsletter footer → email de bienvenue  
4. `/admin` → tableau de bord (si Supabase OK)  
5. Météo accueil → température réelle (si clé OpenWeather OK)

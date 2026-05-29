# Mise en production MooreaNews — checklist

## 1. Supabase (une fois)

SQL Editor → exécuter **`supabase/prod-setup-all.sql`**

Vérifier dans **Admin → Config prod** (`/admin/setup`) que tout est vert.

## 2. Vercel — variables d'environnement

| Variable | Obligatoire | Usage |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | Base |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Base |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Admin, crons, stats |
| `RESEND_API_KEY` | Oui | Emails digest + alertes |
| `RESEND_FROM` | Oui | `MooreaNews <postmaster@mooreanews.com>` |
| `CRON_SECRET` | Recommandé | Sécuriser les crons |
| `VAPID_PUBLIC_KEY` | Push | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Push | idem |
| `VAPID_SUBJECT` | Push | `mailto:postmaster@mooreanews.com` |
| `WORLD_TIDES_API_KEY` | Optionnel | Marées WorldTides/SHOM |
| `STRIPE_SECRET_KEY` | Monétisation | Dashboard Stripe |
| `STRIPE_WEBHOOK_SECRET` | Monétisation | Webhook `/api/stripe/webhook` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Monétisation | Boutons paiement |

Après ajout : **Redeploy** le projet.

## 3. Stripe webhook

URL : `https://www.mooreanews.com/api/stripe/webhook`  
Événement : `checkout.session.completed`

## 4. Crons Vercel (vercel.json)

- 04:00 UTC — veille RSS
- 16:00 UTC (6h Tahiti) — digest matin
- Vendredi 03:00 UTC (jeudi 17h Tahiti) — digest week-end

## 5. Test rapide

- `/admin/setup` — tout vert
- `/alertes` — abonnement push/email quartier
- Admin → alerte **urgente** — email newsletter + push
- `/` — carte « Près de moi » + filtre quartier
- `/commercant` — formulaire + premium Stripe
- `/annonces/[id]` — bouton boost

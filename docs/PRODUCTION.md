# Mise en production MooreaNews — guide pas à pas

## Pourquoi `/admin/setup` affiche 404 ?

Cette page a été ajoutée récemment. Un **404** signifie que **Vercel n’a pas encore déployé la dernière version** du code.

**Correction :**
1. [vercel.com](https://vercel.com) → projet **mooreanews**
2. Onglet **Deployments** → vérifier que le dernier commit (`Intègre la vigilance météo…` ou plus récent) est **Ready**
3. Sinon : **Redeploy** → Deployments → ⋮ → **Redeploy**
4. Attendre 2–3 min → retester [mooreanews.com/admin/setup](https://mooreanews.com/admin/setup) (connecté en admin)

---

## Étape 1 — Supabase (SQL, 5 min)

1. Ouvrir [supabase.com](https://supabase.com) → votre projet MooreaNews
2. Menu **SQL Editor** → **New query**
3. Copier-coller tout le fichier **`supabase/prod-setup-all.sql`**
4. Cliquer **Run**
5. Message **Success** attendu (pas d’erreur rouge)

**Vérification :** Table Editor → tables `page_views`, `push_subscriptions`, `alert_email_subscriptions`, `commerce_payments` visibles.

---

## Étape 2 — Vercel variables d’environnement (15 min)

1. [vercel.com](https://vercel.com) → projet **mooreanews** → **Settings** → **Environment Variables**
2. Ajouter chaque ligne (Production + Preview si vous voulez) :

| Variable | Où la trouver | Obligatoire |
|----------|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secret) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://www.mooreanews.com` | ✅ |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys | ✅ emails |
| `RESEND_FROM` | `MooreaNews <postmaster@mooreanews.com>` | ✅ |
| `CRON_SECRET` | Inventez une longue phrase secrète (ex. `openssl rand -hex 32`) | ✅ recommandé |
| `VAPID_PUBLIC_KEY` | Terminal : `npx web-push generate-vapid-keys` | ✅ push |
| `VAPID_PRIVATE_KEY` | idem | ✅ push |
| `VAPID_SUBJECT` | `mailto:postmaster@mooreanews.com` | ✅ push |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys | ✅ paiements |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks (étape 3) | ✅ paiements |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → pk_live_… | ✅ paiements |
| `WORLD_TIDES_API_KEY` | [worldtides.info](https://www.worldtides.info/register) | optionnel |
| `AUTO_ALERTS_FROM_VEILLE` | `true` | optionnel alertes RSS |

3. **Save** sur chaque variable
4. **Deployments** → **Redeploy** (obligatoire après ajout de variables)

---

## Étape 3 — Stripe webhook (5 min)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. **Add endpoint**
3. URL : `https://www.mooreanews.com/api/stripe/webhook`
4. Événement : **`checkout.session.completed`**
5. Copier le **Signing secret** (`whsec_…`) → Vercel → `STRIPE_WEBHOOK_SECRET`
6. Redeploy Vercel

**Test :** `/commercant` → bouton premium → paiement test Stripe (mode test d’abord si vous préférez).

---

## Étape 4 — Cron unique (Vercel Hobby)

Un seul cron dans `vercel.json` :

| Schedule UTC | Heure Tahiti | Route |
|--------------|--------------|-------|
| `5 16 * * *` | ~6h05 | `/api/cron/daily` |

**Ce job fait tout en une fois :**
- Vigilance météo meteo.pf
- Veille RSS + Facebook
- Digest matin (si 5h–10h Tahiti)
- Digest week-end (vendredi matin Tahiti)
- Expiration alertes, ferry, Telegram

**Vigilance l’après-midi :** mise à jour aussi quand quelqu’un ouvre l’accueil ou `/alertes`.

### Lancer le cron à la main (prod ou local)

```bash
curl "https://www.mooreanews.com/api/cron/daily?secret=VOTRE_CRON_SECRET"
```

En local (`npm run dev`) :

```bash
curl "http://localhost:3000/api/cron/daily?secret=VOTRE_CRON_SECRET"
```

(Put `CRON_SECRET` dans `.env.local` pour le test local.)

**Les crons ne tournent pas tout seuls en local** — c’est normal. Sur Vercel, 1×/jour automatiquement.

---

## Étape 5 — Vérification finale

1. [mooreanews.com/admin/setup](https://mooreanews.com/admin/setup) → tout vert
2. [mooreanews.com/alertes](https://mooreanews.com/alertes) → vigilance météo visible
3. Admin → créer alerte **urgente** → email + push
4. `/` → carte « Près de moi »
5. `/commercant` → Stripe

---

## Dépannage rapide

| Problème | Cause probable | Action |
|----------|----------------|--------|
| 404 `/admin/setup` | Vieux déploiement | Redeploy Vercel |
| Emails ne partent pas | Resend absent | `RESEND_*` + redeploy |
| Push ne marche pas | VAPID absent | Générer clés + redeploy |
| Stripe erreur | Webhook / clés | Vérifier `whsec_` et pk_live |
| Tables rouges dans setup | SQL non exécuté | `prod-setup-all.sql` |
| Cron 401 | Secret incorrect | `CRON_SECRET` identique partout |

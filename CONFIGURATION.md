# Checklist configuration MooreaNews (production)

À faire sur **Vercel → Settings → Environment Variables** (cocher Production + Preview + Development).

**Important :** après toute modification de variable, aller dans **Deployments → … → Redeploy**. Sinon l’admin affiche encore « Supabase non configuré » et les stats restent vides.

## Minimum (formulaires + météo)

| Variable | Exemple |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.mooreanews.com` |
| `OPENWEATHERMAP_API_KEY` | clé [openweathermap.org](https://openweathermap.org/api) |
| `RESEND_API_KEY` | clé Resend |
| `RESEND_FROM` | `MooreaNews <postmaster@mooreanews.com>` |
| `RESEND_ADMIN` | `postmaster@mooreanews.com` |
| `CONTACT_TO_EMAIL` | `postmaster@mooreanews.com` (alias de `RESEND_ADMIN`) |
| `NEXT_PUBLIC_SITE_EMAIL` | `postmaster@mooreanews.com` — **affiché** sur le site (footer, Contact). Pas `postmater` (faute de frappe). |

Si le site affiche encore `contact@mooreanews.com`, le déploiement Vercel est obsolète : **Deployments → dernier commit → Redeploy** (ou définir `NEXT_PUBLIC_SITE_EMAIL=postmaster@mooreanews.com` puis redéployer).
| `TELEGRAM_BOT_TOKEN` | token @BotFather (optionnel) |
| `TELEGRAM_CHAT_ID` | id du chat / groupe (optionnel) |

Alias acceptés : `OPENWEATHER_API_KEY` → météo ; `CONTACT_TO_EMAIL` → email admin contact.

**Resend :** vérifier le domaine `mooreanews.com` (DNS TXT) sur resend.com.

## Admin + base de données

| Variable | Où la trouver |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | idem (secret) |
| `CRON_SECRET` | `openssl rand -hex 32` |

### Images / affiches (admin)

1. Supabase → **SQL Editor** → exécuter le fichier `supabase/storage-media.sql` (bucket public `media`, max 5 Mo).
2. Admin → **Événements** ou **Articles** → *Choisir une image depuis l’ordinateur* (votre affiche JPEG/PNG).

Le formulaire public `/soumettre` accepte une **affiche (photo)** : téléversement vers Supabase Storage (`/api/submit/upload`, dossier `submissions/`). Obligatoire pour événement et annonce. À l’approbation, l’image est recopiée sur l’événement ou l’annonce publiée.

Puis dans Supabase SQL Editor : exécuter `supabase/01-tables.sql` puis `supabase/02-rls.sql`, puis en local `npm run seed`.

Promouvoir votre compte admin :

```sql
update public.profiles set role = 'admin' where email = 'votre@email.com';
```

**Supabase → Authentication → URL Configuration**

| Champ | Valeurs |
|-------|---------|
| Site URL | `https://www.mooreanews.com` |
| Redirect URLs | `https://www.mooreanews.com/auth/callback` |
| | `https://mooreanews.com/auth/callback` |
| | `https://www.mooreanews.com/auth/reset-password` |
| | `https://mooreanews.com/auth/reset-password` |
| | `https://www.mooreanews.com/**` |
| | `http://localhost:3000/auth/callback` (dev local) |
| | `http://localhost:3000/auth/reset-password` (dev local) |

Sans ces URLs, le lien « Confirmer l’email » arrive sur `/?code=…` et l’inscription échoue.

## Restaurants (admin)

| Action | Comment |
|--------|---------|
| **Ajouter un restaurant** | Admin → Restaurants → **Nouveau restaurant** → enregistrer (va directement dans Supabase, visible sur le site) |
| **Modifier / supprimer** | Admin → Restaurants → icônes sur la ligne |
| **Catalogue pré-rempli** (Maïtaï, Mo'z Pizza uniquement) | Admin → Restaurants → bannière **Importer dans Supabase** (1 clic, pas de SQL) |

Le fichier `data/restaurants.json` sert de référence et de fallback local sans Supabase. **Une suppression en base ne réaffiche pas** les autres fiches du JSON (Mahogany, etc.) : seules les nouveautés listées dans `RESTAURANT_CATALOG_IMPORT_SLUGS` proposent l’import.

## Bandeau d’alerte (optionnel)

| Variable | Exemple |
|----------|---------|
| `INFO_BANNER_ENABLED` | `true` |
| `INFO_BANNER_MESSAGE` | `Coupure d'eau demain 8h-12h à Maharepa` |
| `INFO_BANNER_HREF` | `/actualites/mon-article` (optionnel) |
| `INFO_BANNER_VARIANT` | `info`, `warning` ou `alert` |

## Variables par fonctionnalité

| Route / fonction | Variables requises |
|------------------|-------------------|
| Météo accueil (`/api/weather`) | `OPENWEATHERMAP_API_KEY` |
| Contact (`/api/contact`) | `RESEND_*` |
| Soumettre (`/api/submit`) | `RESEND_*`, `TELEGRAM_*` (opt.), Supabase |
| Newsletter (`/api/newsletter`) | `RESEND_*`, Supabase |
| Cron veille (`/api/cron/aggregate`) | `CRON_SECRET`, Supabase service role |
| Facebook pages (posts récents) | `FACEBOOK_PAGE_ACCESS_TOKEN` (optionnel) |
| Permalinks Facebook supplémentaires | `FACEBOOK_WATCH_URLS` (URLs séparées par des virgules) |

## Veille automatique (RSS + Facebook + web)

Guide détaillé : **[VEILLE.md](./VEILLE.md)**

Checklist rapide :

1. Table `external_articles` créée dans Supabase (`supabase/schema.sql`).
2. Vercel : `SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET` (Production).
3. **Admin → Veille externe → Agréger maintenant** (première fois).
4. Vérifier `/actualites` et l’accueil (bloc « Moorea sur le web & Facebook »).

- **Fréquence** : cron `0 4 * * *` (UTC) = **18h00 Tahiti**, **1×/jour** — adapté au plan Hobby.
- **Facebook** : commune + groupe + permalinks déjà dans le code ; jeton Meta optionnel pour la page Commune.
- **Test cron** : `GET /api/cron/aggregate?secret=VOTRE_CRON_SECRET` ou `npm run veille` en local
- **Plusieurs fois / jour (Hobby)** : [VEILLE-LOCALE.md](./VEILLE-LOCALE.md) — script Mac ou cron-job.org
- **Sites web Moorea** : `WEB_WATCH_URLS` sur Vercel (URLs séparées par des virgules)
| Admin / auth | Supabase (URL + anon + service role) |

## Tests après config

1. `/soumettre` → email + Telegram reçus  
2. `/contact` → email reçu  
3. Newsletter footer → email de bienvenue  
4. `/admin` → tableau de bord avec chiffres  
5. Météo accueil → température réelle  
6. `/annonces/[slug]`, `/activites/[slug]`, `/infos-pratiques/[slug]` → pages détail OK  
7. `/recherche?q=moorea` → liens vers fiches individuelles

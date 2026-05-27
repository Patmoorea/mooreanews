# Veille automatique MooreaNews (Facebook + internet)

## Ce que le site fait

| Source | Fréquence | Où ça s’affiche |
|--------|-----------|-----------------|
| RSS (Tahiti Infos, La 1ère, Présidence, Radio 1, Google News Moorea) | Cron horaire | Accueil + `/actualites` |
| Liens Facebook configurés (commune, groupe, permalinks) | Cron horaire | Idem |
| Page Facebook Commune (API Meta, si jeton) | Cron horaire | Idem |

**Liens Facebook déjà dans le code** (`src/lib/watch-sources.ts`) :

- Page Commune : `https://www.facebook.com/CommuneMooreaMaiao`
- Photo commune : `https://www.facebook.com/photo?fbid=1291881963133173&set=a.396025476052164`
- Groupe MOOREA : permalinks dont `…/permalink/2169618270558854/`

Pour en ajouter : variable Vercel `FACEBOOK_WATCH_URLS` (URLs séparées par des virgules) ou Admin → Veille externe → formulaire.

## Pourquoi « aucune info » sur mooreanews.com ?

La veille **ne tourne pas toute seule** tant que ces 3 points ne sont pas OK :

### 1. Table Supabase `external_articles`

Dans le SQL Editor Supabase, exécuter `supabase/schema.sql` ou au minimum `supabase/01-tables.sql` + `supabase/02-rls.sql`.

### 2. Variables Vercel (Production)

| Variable | Obligatoire | Rôle |
|----------|-------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | Base |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Lecture publique |
| `SUPABASE_SERVICE_ROLE_KEY` | **Oui pour la veille** | Écriture cron |
| `CRON_SECRET` | **Oui** | Sécurise `/api/cron/aggregate` |

Optionnel (Facebook page Commune — posts récents via API) :

| Variable | Rôle |
|----------|------|
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Jeton page CommuneMooreaMaiao |
| `FACEBOOK_USER_ACCESS_TOKEN` | Jeton utilisateur → récupère toutes vos pages via `/me/accounts` |

### 3. Lancer la première collecte

**Option A — Admin (recommandé une fois connecté)**  
`/admin/external` → bouton **Agréger maintenant**

**Option B — URL cron (test)**  
```
https://www.mooreanews.com/api/cron/aggregate?secret=VOTRE_CRON_SECRET
```
Réponse JSON : `totalInserted`, `errors`, `bySource`.

**Option C — Vercel Cron**  
Déjà dans `vercel.json` : `0 * * * *` (toutes les heures).  
⚠️ Plan **Hobby** : **1 exécution cron par jour maximum**. Pour une vraie veille horaire → plan **Pro**.

Après chaque collecte : **Redeploy** ou attendre le prochain build si besoin.

## Limites Facebook (important)

- On ne peut pas « scanner tout Facebook » : Meta bloque sans API.
- **Groupe privé / restreint** : souvent pas de titre Open Graph → le lien apparaît quand même avec le libellé configuré (ex. « Commune — publication photo »).
- **Page Commune** : avec `FACEBOOK_PAGE_ACCESS_TOKEN`, les vrais posts récents remontent mieux.

## Diagnostic rapide

Ouvrir dans le navigateur :

**https://www.mooreanews.com/api/watch/status**

Vous devez voir notamment :

- `"supabaseServiceRole": true`
- `"facebookLinksConfigured": 6` (ou plus)
- `"expectedCronSources"` contenant **`facebook-watch`**
- `"externalArticlesVisible"` > 0 après une collecte

Si `expectedCronSources` **ne contient pas** `facebook-watch` → le site en ligne est une **vieille version** : **Redeploy** sur Vercel (branche `main`).

## Vérification

1. `/admin/external` → liste « Derniers articles agrégés » non vide  
2. `/actualites` → bloc « Moorea sur le web & Facebook »  
3. Accueil → même bloc sous les articles à la une  

## Telegram (optionnel)

`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` → notification quand de nouveaux articles sont insérés.

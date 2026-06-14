# Plan Hobby (0 $) — crons MooreaNews

## Architecture

| Tâche | Où | Horaire (Tahiti) |
|-------|-----|------------------|
| Job quotidien complet | **Vercel** (1 seul cron) | ~6h05 |
| Veille RSS + Facebook + web | **GitHub Actions** | 5h–20h, toutes les heures |
| Météo vigilance après-midi | **GitHub Actions** | ~15h |
| Push digest soir | **GitHub Actions** | jeu–dim ~17h |
| Newsletter abonnés | **GitHub Actions** | dim ~18h |
| IA brouillons (optionnel) | **Mac** `npm run ai:moorea` | manuel ou cron Mac |

Fichiers :
- `vercel.json` → 1 cron : `/api/cron/daily`
- `.github/workflows/veille-hourly.yml`
- `.github/workflows/cron-hobby-extras.yml`

Secret requis : `CRON_SECRET` sur **Vercel** et **GitHub** (Settings → Secrets and variables → Actions).

---

## Vercel — downgrader en Hobby

1. Vercel → **Settings → Billing** → **Downgrade to Hobby**
2. Vérifier qu’il ne reste qu’**un** cron dans `vercel.json` (`/api/cron/daily`)
3. Redéployer

---

## GitHub Actions (déjà configuré dans le repo)

Après push, vérifier : **GitHub → Actions**

| Workflow | Rôle |
|----------|------|
| Veille horaire MooreaNews | RSS → Facebook → web → finish |
| Crons Hobby extras | météo PM, push soir, newsletter |

Si `CRON_SECRET` manque sur GitHub : **Settings → Secrets → New repository secret**.

Test manuel :

```bash
# GitHub → Actions → Crons Hobby extras → Run workflow
```

---

## Alternative : cron-job.org (sans GitHub)

Si vous préférez cron-job.org à la place des workflows GitHub extras, créez **3 jobs** sur [cron-job.org](https://cron-job.org) (GET, fuseau **UTC**) :

Remplacez `VOTRE_CRON_SECRET` par la valeur Vercel.

### 1. Météo après-midi (~15h Tahiti)

- **URL** : `https://www.mooreanews.com/api/cron/meteo-vigilance?secret=VOTRE_CRON_SECRET`
- **Schedule** : `5 1 * * *` (01:05 UTC)

### 2. Push soir (jeu–dim ~17h Tahiti)

- **URL** : `https://www.mooreanews.com/api/cron/evening-push?secret=VOTRE_CRON_SECRET`
- **Schedule** : `0 3 * * 4,5,6,0` (03:00 UTC)

### 3. Newsletter (dim ~18h Tahiti)

- **URL** : `https://www.mooreanews.com/api/cron/weekly-newsletter?secret=VOTRE_CRON_SECRET&wait=1`
- **Schedule** : `0 4 * * 1` (04:00 UTC lundi)
- **Timeout** : 300 s minimum

### Veille horaire (si GitHub Actions indisponible)

- **URL** : `https://www.mooreanews.com/api/cron/aggregate?secret=VOTRE_CRON_SECRET&wait=1&part=rss`
- **Schedule** : `0 15-23,0-6 * * *` (toutes les heures 5h–20h Tahiti)

Jobs Facebook / web / finish : enchaîner comme dans `veille-hourly.yml` ou utiliser GitHub.

---

## Test local

```bash
npm run veille
curl "https://www.mooreanews.com/api/cron/daily?secret=VOTRE_CRON_SECRET"
```

---

## Ce que fait `/api/cron/daily` (1×/jour Vercel)

Météo matin, veille complète, digests (si créneau), emploi, coupures, garde week-end, audit, Telegram, token Facebook.

Les créneaux **après-midi météo**, **push soir** et **newsletter** sont couverts par GitHub Actions (ou cron-job.org).

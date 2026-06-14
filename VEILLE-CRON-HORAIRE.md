# Veille toutes les heures

> Plan Hobby : voir **[docs/CRON-HOBBY.md](./docs/CRON-HOBBY.md)** (1 cron Vercel + GitHub Actions + cron-job.org en secours).

## Déjà actif : GitHub Actions (recommandé)

Le dépôt **Patmoorea/mooreanews** lance la veille via GitHub Actions :

- Fichier : `.github/workflows/veille-hourly.yml`
- **Horaires : toutes les heures de 5h à 20h (heure de Tahiti)** — 16 passages/jour
- Secret : `CRON_SECRET` (déjà configuré sur GitHub)
- Vérifier : **GitHub → Actions → Veille horaire MooreaNews**

Aucun compte cron-job.org requis.

---

## Alternative : cron-job.org (gratuit)

Pour publier une **affiche Facebook MooreaNews** sur le site **dans l’heure** qui suit, planifiez la veille **toutes les heures** (Mac éteint OK).

## Prérequis Vercel

| Variable | Valeur |
|----------|--------|
| `CRON_SECRET` | secret long (identique à `.env.local`) |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | jeton page MooreaNews |
| `FACEBOOK_IMPORT_AS_ARTICLES` | `true` |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | alertes admin |

Optionnel : `FACEBOOK_ARTICLES_PUBLISHED=false` → brouillon admin avant mise en ligne.

## Comportement import Facebook

| Post Facebook | Rubrique MooreaNews |
|---------------|---------------------|
| **Affiche** (image) + texte court / date / « concert », « marché »… | **Événements** (`/evenements`) |
| « à vendre », « loue », emploi… | **Annonces** |
| Texte d’actualité sans affiche événement | **Actualités** |

Déduplication : un même post Facebook n’est importé qu’**une fois**.

## Configurer cron-job.org (gratuit)

1. Compte sur **https://cron-job.org** (gratuit).
2. **Cronjobs** → **Create cronjob**.
3. **Title** : `MooreaNews veille`
4. **URL** :
   ```
   https://www.mooreanews.com/api/cron/aggregate?secret=VOTRE_CRON_SECRET
   ```
   Remplacez `VOTRE_CRON_SECRET` par la valeur Vercel (Settings → Environment Variables).
5. **Schedule** : toutes les heures **5h–20h Tahiti**  
   - Expression UTC : `0 15-23,0-6 * * *`  
   - (Tahiti = UTC−10, pas de changement d’heure)
6. **Request method** : GET  
7. **Activer** le job → Save.

Fuseau : le serveur cron-job.org est en UTC ; « toutes les heures » suffit pour votre besoin (~1 h max après publication Facebook).

## Horaires suggérés (Tahiti)

Si vous préférez **4×/jour** au lieu de 24× :

| Heure Tahiti (approx.) | UTC (hiver) | Cron |
|------------------------|-------------|------|
| 8h | 18h veille | `0 18 * * *` |
| 12h | 22h | `0 22 * * *` |
| 17h | 3h | `0 3 * * *` |
| 21h | 7h | `0 7 * * *` |

Plusieurs crons = plusieurs jobs sur cron-job.org avec la **même URL**.

## Vérifier

```bash
npm run veille
```

Réponse JSON : `eventsCreated`, `articlesCreated`, `announcementsCreated`.  
Telegram : lien vers le nouvel événement dans l’agenda.

## Test manuel (navigateur)

```
https://www.mooreanews.com/api/cron/aggregate?secret=VOTRE_CRON_SECRET
```

Ne partagez pas cette URL publiquement (secret dans l’URL).

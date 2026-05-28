# Veille plus souvent (Mac local, cron externe, Facebook)

## Ce que fait MooreaNews aujourd’hui

| Action | Automatique ? | Où sur le site |
|--------|----------------|----------------|
| Trouver un article RSS / Google News avec « Moorea » | Oui (cron ou script) | Bloc **« Moorea sur le web & Facebook »** |
| Vérifier liens Facebook + pages web listées | Oui | Idem (lien vers la source) |
| Créer une **vraie actualité** MooreaNews (`/actualites/…`) | **Non** — admin ou `/soumettre` | Rubrique Actualités |

**« Mettre en ligne »** pour la veille = **afficher le lien + titre** sur l’accueil (souvent en quelques minutes après la collecte). Ce n’est pas une réécriture d’article par une IA sur le serveur.

---

## Pourquoi pas « toutes les heures » sur Vercel Hobby ?

- Plan **Hobby** : **1 seul cron Vercel par jour** (déjà réglé ~**18h Tahiti**).
- Une **IA locale** (Cursor, Ollama, etc.) **ne remplace pas** le serveur : elle ne peut pas écrire dans Supabase tant qu’elle n’appelle pas l’API du site.

---

## 3 façons d’avoir plusieurs collectes par jour

### 1. Script sur votre Mac (recommandé avec Hobby)

```bash
npm run veille
```

Utilise `CRON_SECRET` depuis `.env.local` et appelle la même API que Vercel.

**Planifier 3–4×/jour** (Mac allumé) :

- Ouvrir **Réglages → Général → Éléments de connexion → +**
- Ou crontab : `0 8,12,17,21 * * * cd /chemin/moorea-hub && npm run veille`

### 2. Cron gratuit sur Internet (Mac éteint OK)

Services type [cron-job.org](https://cron-job.org) :

- URL : `https://www.mooreanews.com/api/cron/aggregate?secret=VOTRE_CRON_SECRET`
- Horaires exemple : **8h, 12h, 17h, 21h** (heure Tahiti)

Même effet que le script, sans ouvrir l’ordinateur.

### 3. Vercel Pro

Plusieurs crons Vercel possibles (vraie fréquence horaire si besoin).

---

## Facebook & sites Moorea — que le robot vérifie

**Déjà dans le code** (`src/lib/watch-sources.ts`) :

- Page **Commune Moorea-Maiao**
- Groupe **MOOREA Qui sait quoi ???** (+ permalinks)
- **Mairie** (site web)
- **Moorea.life**
- **5 flux RSS** (Tahiti Infos, La 1ère, Présidence, Radio 1, Google News Moorea)

**À ajouter sans coder** (Vercel → Variables) :

| Variable | Exemple |
|----------|---------|
| `FACEBOOK_WATCH_URLS` | `https://www.facebook.com/AutrePageMoorea,https://…` |
| `WEB_WATCH_URLS` | `https://www.exemple.pf/,https://…` |

**Pour de vrais posts Facebook récents** (pas seulement Open Graph) :

- `FACEBOOK_PAGE_ACCESS_TOKEN` (page Commune) sur Vercel

**Limites Meta** : pas de lecture d’un groupe **privé** sans droits API ; pas de « tout Facebook ».

---

## Votre IA locale — rôle réaliste

| L’IA locale peut | L’IA locale ne peut pas (seule) |
|------------------|----------------------------------|
| Lancer `npm run veille` plusieurs fois | Publier sur mooreanews.com sans API |
| Vous aider à rédiger puis coller dans **Admin → Articles** | Scanner Facebook en continu comme un humain |
| Proposer des URLs à mettre dans `FACEBOOK_WATCH_URLS` | Remplacer le cron serveur |

Workflow utile : **IA rédige** → vous validez dans **Admin** ou **/soumettre** → publication.

---

## Vérifier que ça marche

1. https://www.mooreanews.com/api/watch/status  
2. `npm run veille` (après deploy du code `web-watch`)  
3. Accueil → bloc **Moorea sur le web & Facebook**

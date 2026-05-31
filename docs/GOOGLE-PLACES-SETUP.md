# Google Places — statut « ouvert » fiable (restaurants)

MooreaNews **n’invente plus** les horaires. Un restaurant n’apparaît ouvert que si **Google Maps** ou le **commerçant** le confirme.

---

## Étape 1 — Google Cloud (10 min, une seule fois)

1. Ouvrir [console.cloud.google.com](https://console.cloud.google.com)
2. Créer ou choisir un projet (ex. `mooreanews`)
3. **APIs & Services → Bibliothèque** → activer **Places API (New)**  
   *(pas l’ancienne « Places API » seule)*
4. **APIs & Services → Identifiants → Créer une clé API**
5. Restreindre la clé :
   - **Restrictions API** → cocher uniquement **Places API (New)**
   - **Restrictions applicatives** → adresses IP Vercel ou « Aucune » si vous utilisez uniquement côté serveur (recommandé : restriction IP + serveur only)

6. Copier la clé (`AIza…`)

---

## Étape 2 — Vercel (2 min)

1. [vercel.com](https://vercel.com) → projet **mooreanews** → **Settings → Environment Variables**
2. Ajouter :

| Variable | Valeur |
|----------|--------|
| `GOOGLE_PLACES_API_KEY` | votre clé `AIza…` |

3. **Production** (+ Preview si besoin) → **Save**
4. **Deployments → Redeploy** (obligatoire)

---

## Étape 3 — Supabase SQL (1 min)

Si pas déjà fait :

```sql
-- Contenu de supabase/restaurant-open-status.sql
-- ou ré-exécuter supabase/prod-setup-all.sql
```

Colonnes ajoutées : `google_place_id`, `merchant_open_status`, `merchant_open_updated_at`.

---

## Étape 4 — Place ID par restaurant (Admin)

Pour **chaque** restaurant :

1. Aller sur [mooreanews.com/admin/restaurants](https://www.mooreanews.com/admin/restaurants)
2. Cliquer **Éditer** sur la fiche
3. Bloc **« Rechercher le lieu sur Google Maps »** :
   - Saisir le nom exact (ex. `Snack Mahana Moorea`)
   - **Chercher** → cliquer le bon résultat
   - Le **Place ID** (`ChIJ…`) se remplit automatiquement
4. (Optionnel) **Email commerçant** : permet la déclaration manuelle sur `/commercant`
5. **Enregistrer**

### Sans recherche admin (manuel)

1. Google Maps → trouver le restaurant
2. **Partager** → copier le lien  
   Le Place ID est parfois dans l’URL, sinon utiliser [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder)
3. Coller dans **Google Place ID** en admin

---

## Étape 5 — Vérifier

1. `/admin/setup` → pas d’erreur liée aux restos
2. `/restaurants` → badge **Ouvert** / **Fermé** avec source **Google Maps** (si configuré)
3. Si rien ne s’affiche : normal = **inconnu** (mieux qu’un faux positif)

---

## Coût API

- ~1 requête / restaurant / 15 min (cache site)
- Places API (New) : facturation Google Cloud — activer une alerte budget (ex. 5 €/mois)

---

## Plan B — sans Google (gratuit)

Renseigner **Email commerçant** sur la fiche → le restaurateur va sur **`/commercant`** → **Nous sommes ouverts / Fermé** (valable 12 h).

# Notifications push — configuration Vercel

## 1. Générer vos clés (une fois, sur votre Mac)

```bash
cd /Users/patricejourdan/Desktop/moorea-hub
npx web-push generate-vapid-keys
```

Vous obtenez deux lignes, par exemple :

```
Public Key:
BHPw07flqWVxj9byps5y2d9aqrfIxmuoBi6sECD19vT5DjUgG05wRyoW5v8azCdxeN85Rq6lGThJmcXaBrBXkrc

Private Key:
gKzF9yl-X_B560eKWsm2GyYVIqSKEcEvut_IAK6eO_c
```

**Ne partagez jamais la clé privée** (GitHub, chat public). Gardez-la uniquement sur Vercel.

## 2. Ajouter les variables sur Vercel

1. [vercel.com](https://vercel.com) → projet **mooreanews** (ou MooreaNews)
2. **Settings** → **Environment Variables**
3. Ajoutez **3 variables** (cochez Production + Preview + Development) :

| Nom | Valeur | Exemple |
|-----|--------|---------|
| `VAPID_PUBLIC_KEY` | La ligne **Public Key** (tout le texte, sans espaces en trop) | `BHPw07flqWVxj9by...` |
| `VAPID_PRIVATE_KEY` | La ligne **Private Key** | `gKzF9yl-X_B560eK...` |
| `VAPID_SUBJECT` | Email de contact du site (format obligatoire) | `mailto:postmaster@mooreanews.com` |

`VAPID_SUBJECT` doit commencer par `mailto:` suivi de **votre** email réel (celui affiché sur le site).

4. **Save**
5. **Deployments** → dernier déploiement → **⋯** → **Redeploy** (pour charger les variables)

## 3. Supabase (tables push)

Dans **Supabase → SQL Editor**, exécutez :

`supabase/push-and-district-alerts.sql`

## 4. Vérifier

```bash
npm run check:push
# ou
curl -s https://www.mooreanews.com/api/push/status | jq
```

- Page `/alertes` → bloc « Alertes par quartier » → **Activer notifications push**
- Bandeau sur l'accueil (si pas encore abonné)
- **Admin → Configuration production** → bouton **Envoyer notification test**

Si rien ne part : vérifiez les 3 variables Vercel + redéploiement + `prod-setup-all.sql` exécuté.

# MooreaNews — L'info de Moorea et de la Polynésie française

Site d'information centralisé pour l'île de Moorea, en Polynésie française.

Conçu pour remplacer l'ancien `mooreanews.com` (abandonné depuis 2022) par une
plateforme moderne, multilingue, automatisée et pensée pour la communauté.

> 🌺 **Ia ora na — Bienvenue sur Moorea.**

---

## ✨ Fonctionnalités

### Phase 1 — MVP (livrée)

- **Design polynésien tropical** : palette lagon/tiare/couchant, typo Marcellus + Inter, motifs tapa, animations douces
- **Widgets live** mis à jour automatiquement :
  - Météo Moorea (OpenWeatherMap)
  - Ferries Tahiti ↔ Moorea (horaires-tahiti.com)
  - Lever / coucher du soleil + phase de la lune (sunrise-sunset.org)
  - Marées indicatives (calcul interne)
  - Prévisions 5 jours
- **Bandeau ticker animé** en haut de site
- **Catégories de contenu** : actualités, événements, annonces, restaurants, activités, infos pratiques
- **Pages détail articles** avec partage (Facebook, WhatsApp, email) et JSON-LD
- **Recherche full-text** globale (header modal + page résultats)
- **Carte interactive Moorea** (Leaflet + OpenStreetMap) avec filtres
- **Formulaire de soumission communautaire** avec notification Telegram + email
- **Inscription newsletter** (Resend)
- **Pages** : contact, à propos, mentions légales, confidentialité, 404
- **SEO** : sitemap, robots, Open Graph dynamique, JSON-LD, PWA manifest
- **Multi-device** : entièrement responsive, mobile-first

### Phase 2 — Communauté (livrée)

- **Authentification Supabase** : signup / login / forgot-password / callback
- **Rôles** : user, editor, admin (table `profiles` + helper `is_admin()`)
- **Interface admin complète** avec sidebar et 8 sections :
  - Tableau de bord avec statistiques live
  - CRUD articles, événements, annonces, restaurants, activités, infos
  - Modération des soumissions communautaires (approuver → crée l'item)
  - Liste des inscrits newsletter + export CSV
- **Middleware** : refresh de session + protection des routes /admin
- **UserMenu** dans le header (avatar + dropdown ou bouton connexion)
- **Row Level Security** : public read, admin write, lecture publique limitée aux contenus publiés
- **Bascule auto contenu** : Supabase si configuré, sinon fallback JSON
- **Persistance** : soumissions et newsletter inscrites en base
- **Script de seed** des JSON vers Supabase (`npm run seed`)

### Phase 3 — Automatisation (livrée)

- **Agrégation RSS automatique** depuis 4 sources : Tahiti Infos,
  Polynésie La 1ère, Présidence Polynésie, Radio 1 Tahiti
- **Parser RSS pur** (sans dépendance) : supporte RSS 2.0 et Atom 1.0
- **Filtrage intelligent** par mots-clés Moorea (lieux, districts, surnoms)
- **Déduplication** par hash source + GUID externe
- **Cron Vercel** : exécution quotidienne automatique via `vercel.json` (plan Hobby = 1×/jour à 17h UTC, soit 7h heure de Tahiti)
- **Endpoint protégé** par `CRON_SECRET` (Bearer token)
- **Notification Telegram** quand de nouveaux articles sont agrégés
- **Section "Veille externe"** sur la page actualités publique
- **Admin /admin/external** : liste des articles agrégés, lancer
  l'agrégation manuellement, masquer/afficher individuellement

### Phase 4 — Premium (à venir)

- PWA installable + notifications push
- API publique
- Espace commerçants premium
- Upload d'images (Supabase Storage)

---

## 🛠 Stack technique

| Couche             | Techno                       |
| ------------------ | ---------------------------- |
| Framework          | Next.js 16 (App Router)      |
| Langage            | TypeScript                   |
| UI                 | Tailwind CSS 4               |
| Icônes             | Lucide React                 |
| Auth & DB          | Supabase (Auth + Postgres)   |
| Cartes             | Leaflet + OpenStreetMap      |
| Emails             | Resend                       |
| Notifs admin       | Telegram Bot API             |
| Hébergement        | Vercel                       |
| Domaine            | mooreanews.com (OVH)         |

---

## 🚀 Démarrer en local

```bash
# 1) Cloner et installer
git clone <repo-url> moorea-hub
cd moorea-hub
npm install

# 2) Configurer les variables d'environnement
cp .env.example .env.local
# puis remplir au minimum : OPENWEATHERMAP_API_KEY (optionnel)

# 3) Lancer le serveur de dev
npm run dev

# Ouvrir http://localhost:3000
```

Aucune variable n'est obligatoire pour démarrer : tous les widgets ont un
fallback intégré (météo, ferries, soleil/lune, marées). Le site
fonctionne aussi sans Supabase grâce au contenu JSON dans `/data`.

---

## 🔐 Activer Supabase (Phase 2)

L'activation de Supabase débloque l'authentification, l'interface
admin complète, la persistance des soumissions et de la newsletter.

### 1. Créer le projet

1. Aller sur [supabase.com](https://supabase.com) → New Project
2. Récupérer dans **Settings → API** :
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (secret, jamais côté client)

### 2. Initialiser le schéma

Dans le **SQL Editor** de Supabase, coller et exécuter le contenu de
`supabase/schema.sql`. Cela crée :

- Les tables : `profiles`, `articles`, `events`, `announcements`,
  `restaurants`, `activities`, `info_pratiques`, `submissions`,
  `newsletter_subscribers`
- Le trigger `handle_new_user` pour créer un profil à chaque inscription
- Les policies RLS (Row Level Security)
- La fonction helper `is_admin()`

### 3. Importer le contenu initial

```bash
npm run seed
```

Ce script importe le contenu JSON de `/data` dans Supabase. Idempotent
(les tables sont vidées avant l'import).

### 4. Vous promouvoir en admin

Après vous être inscrit via `/auth/signup`, exécutez dans le SQL Editor :

```sql
update public.profiles set role = 'admin' where email = 'votre@email.com';
```

Vous pouvez maintenant accéder à `/admin` et gérer tout le contenu.

### 5. Configurer l'email de confirmation Supabase

Dans **Authentication → Email Templates** :

- Personnaliser le template "Confirm signup"
- Mettre l'URL de redirection sur `https://mooreanews.com/auth/callback`

---

## 🌍 Déployer sur Vercel + OVH

### 1. Pousser sur GitHub

```bash
git remote add origin https://github.com/<vous>/moorea-hub.git
git push -u origin main
```

### 2. Importer sur Vercel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. Importer le repo `moorea-hub`
3. Renseigner les variables d'environnement (cf. `.env.example`)
4. Déployer

### 3. Connecter le domaine `mooreanews.com`

Sur Vercel :

1. **Settings → Domains → Add**
2. Ajouter `mooreanews.com` ET `www.mooreanews.com`

Sur OVH (DNS Zone) :

| Type  | Sous-domaine | Cible                     |
| ----- | ------------ | ------------------------- |
| A     | @            | `76.76.21.21`             |
| CNAME | www          | `cname.vercel-dns.com`    |

Délai de propagation DNS : quelques minutes à quelques heures.

---

## 📁 Structure

```
moorea-hub/
├── data/                       # JSON statiques (articles, events, restos…)
├── src/
│   ├── app/
│   │   ├── api/                # Routes API : weather, ferries, sun, tides, newsletter, submit
│   │   ├── admin/              # Espace admin (Phase 2)
│   │   ├── actualites/
│   │   ├── evenements/
│   │   ├── annonces/
│   │   ├── restaurants/
│   │   ├── activites/
│   │   ├── infos-pratiques/
│   │   ├── soumettre/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── sitemap.ts
│   │   ├── manifest.ts
│   │   └── opengraph-image.tsx
│   ├── components/
│   │   ├── home/               # Sections homepage
│   │   ├── layout/             # Header, Footer, Banners
│   │   ├── widgets/            # WeatherCard, FerryCard, SunMoonCard, TidesCard, Ticker
│   │   ├── ui/                 # Button, Card, Badge, Container
│   │   ├── NewsletterForm.tsx
│   │   └── SubmitForm.tsx
│   └── lib/
│       ├── constants.ts        # Configuration globale
│       ├── utils.ts            # Helpers (dates, slug, cn…)
│       ├── content.ts          # Chargeur JSON
│       ├── content-types.ts    # Types partagés
│       ├── weather.ts          # OpenWeatherMap
│       ├── sun.ts              # Soleil + lune
│       ├── tides.ts            # Marées (calcul interne)
│       ├── ferries.ts          # Ferries Tahiti ↔ Moorea
│       └── telegram.ts         # Notifications Telegram
└── README.md
```

---

## 🌺 Mise à jour du contenu (sans coder)

Toutes les données sont dans `/data/*.json`. Pour ajouter / modifier un article,
un événement, un restaurant, etc. :

1. Ouvrir le fichier sur GitHub (`data/articles.json` par exemple)
2. Cliquer sur le crayon ✏️ « Edit »
3. Modifier le JSON, commit
4. Vercel redéploie automatiquement (~ 30-60 secondes)

**Aucune connaissance technique requise au-delà de l'édition JSON.**

---

## 📬 Soumissions communautaires

Le formulaire `/soumettre` envoie chaque publication :

1. Par **Telegram** instantané à l'admin
2. Par **email** (via Resend) à l'admin

L'admin valide puis ajoute le contenu manuellement dans le JSON correspondant
(Phase 1). En Phase 2, validation depuis l'admin directement avec Supabase.

---

## 📄 Licence

© 2026 MooreaNews. Tous droits réservés.

Fait avec ♥ à Moorea, sous le soleil de Polynésie.

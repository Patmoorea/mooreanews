# Moorea Hub — Le portail vivant de Moorea

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
- **Bandeau ticker animé** en haut de site
- **Catégories de contenu** : actualités, événements, annonces, restaurants, activités, infos pratiques
- **Formulaire de soumission communautaire** avec notification Telegram + email
- **Inscription newsletter** (Resend)
- **SEO** : sitemap, robots, Open Graph dynamique, JSON-LD, PWA manifest
- **Multi-device** : entièrement responsive, mobile-first

### Phase 2 — Communauté (à venir)

- Authentification Supabase (utilisateurs / commerçants / admin)
- Soumission illimitée avec compte
- Modération depuis l'interface admin
- Tags et recherche
- Upload d'images

### Phase 3 — Automatisation (à venir)

- Aggrégation RSS Tahiti Infos, Polynésie 1ère, Mairie de Moorea
- Import événements Facebook publics
- Calendrier centralisé
- Cron jobs horaires (Vercel Cron)

### Phase 4 — Premium (à venir)

- PWA installable + notifications push
- Carte interactive avec marqueurs événements / restaurants / activités
- API publique
- Espace commerçants premium

---

## 🛠 Stack technique

| Couche             | Techno                       |
| ------------------ | ---------------------------- |
| Framework          | Next.js 16 (App Router)      |
| Langage            | TypeScript                   |
| UI                 | Tailwind CSS 4               |
| Icônes             | Lucide React                 |
| Auth & DB (P2)     | Supabase                     |
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
fallback intégré (météo, ferries, soleil/lune, marées).

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

© 2026 Moorea Hub. Tous droits réservés.

Fait avec ♥ à Moorea, sous le soleil de Polynésie.

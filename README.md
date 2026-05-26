# Moorea Hub

> Le portail de l'île de Moorea : événements, annonces, météo, ferries, restaurants, activités et infos pratiques en temps réel.

Site moderne et multilingue (FR/EN/TY) construit avec Next.js 16, Tailwind v4 et next-intl.

## Aperçu

- **Homepage** : hero tropical, widgets live (météo, ferries, marées, soleil/lune), articles à la une, événements à venir, callout publication, newsletter.
- **Pages thématiques** : Événements, Annonces, Restaurants, Activités, Infos pratiques.
- **Publication** : formulaire de soumission ouvert à tous, modération admin via Telegram + email.
- **i18n complet** : français (par défaut), anglais, reo Tahiti (langue tahitienne).
- **Design polynésien** : palette lagon / hibiscus / sable / soleil couchant, animations subtiles, glassmorphism.

## Stack

| Couche       | Techno                                                     |
| ------------ | ---------------------------------------------------------- |
| Framework    | Next.js 16 + React 19 + TypeScript (App Router, Turbopack) |
| Styles       | Tailwind v4 (theme inline) + globals.css                   |
| i18n         | next-intl (FR/EN/TY)                                       |
| Icônes       | lucide-react                                               |
| Validation   | zod                                                        |
| Emails       | Resend                                                     |
| Notifs admin | Telegram bot                                               |
| Hébergement  | Vercel (auto-deploy depuis GitHub)                         |
| Data         | JSON éditable dans `/data` (phase 1) → Supabase (phase 2)  |

## Démarrer

```bash
npm install
cp .env.example .env.local
# remplir les variables (au minimum NEXT_PUBLIC_SITE_URL)
npm run dev
```

Ouvrir http://localhost:3000.

### Variables d'environnement essentielles

Voir [`.env.example`](./.env.example) pour la liste complète. Les minimums pour démarrer :

- `OPENWEATHERMAP_API_KEY` — gratuit sur [openweathermap.org](https://openweathermap.org/api). Sans cette clé, le widget météo affiche une valeur par défaut.
- `RESEND_API_KEY` — gratuit sur [resend.com](https://resend.com). Sans cette clé, les soumissions n'envoient pas d'email.
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — pour recevoir les notifications de soumission.

Tous les widgets continuent de fonctionner même sans clés, en mode dégradé.

## Architecture

```
moorea-hub/
├── data/                         # ← Source de vérité éditable (phase 1)
│   ├── articles.json
│   ├── events.json
│   ├── restaurants.json
│   ├── activities.json
│   ├── announcements.json
│   └── practical-info.json
├── messages/                     # ← Traductions
│   ├── fr.json
│   ├── en.json
│   └── ty.json
└── src/
    ├── app/
    │   ├── [locale]/             # ← Routes localisées
    │   │   ├── page.tsx          # Homepage
    │   │   ├── evenements/
    │   │   ├── annonces/
    │   │   ├── restaurants/
    │   │   ├── activites/
    │   │   ├── infos/
    │   │   ├── publier/
    │   │   ├── contact/
    │   │   ├── legal/
    │   │   └── confidentialite/
    │   ├── api/
    │   │   ├── weather/
    │   │   ├── ferries/
    │   │   ├── sun/
    │   │   ├── submit/
    │   │   └── newsletter/
    │   ├── layout.tsx            # Layout root (fonts, metadata)
    │   ├── globals.css           # Design system + thème
    │   ├── sitemap.ts
    │   ├── robots.ts
    │   └── opengraph-image.tsx
    ├── components/
    │   ├── Header.tsx, Footer.tsx, LanguageSwitcher.tsx
    │   ├── Hero.tsx, LiveWidgets.tsx
    │   ├── ArticleCard.tsx, EventCard.tsx
    │   ├── CategoryGrid.tsx, FeaturedNews.tsx, UpcomingEvents.tsx
    │   ├── SubmitCallout.tsx, SubmitForm.tsx, NewsletterForm.tsx
    │   └── widgets/
    │       ├── WeatherWidget.tsx
    │       ├── FerryWidget.tsx
    │       ├── SunMoonWidget.tsx
    │       └── TideWidget.tsx
    ├── i18n/                     # next-intl
    ├── lib/
    │   ├── constants.ts
    │   ├── content.ts            # Chargeurs JSON typés
    │   ├── ferries.ts, tides.ts, utils.ts
    │   └── telegram.ts
    └── middleware.ts             # next-intl middleware
```

## Modifier le contenu (phase 1)

La phase 1 MVP utilise des fichiers JSON directement éditables sur GitHub.

1. Aller sur [github.com/<your-user>/moorea-hub/tree/main/data](#) (à adapter)
2. Ouvrir le fichier souhaité (ex. `events.json`)
3. Cliquer sur l'icône crayon, modifier
4. "Commit changes" — Vercel redéploie automatiquement en 1-2 min

Pour la phase 2, ce contenu sera migré vers Supabase avec une interface admin web.

## Déploiement Vercel

1. `git init && git add -A && git commit -m "Initial"` (déjà fait par create-next-app)
2. Créer le repo GitHub : `gh repo create moorea-hub --public --source=. --push`
3. Sur [vercel.com](https://vercel.com), importer le repo. Build settings : par défaut.
4. Ajouter les variables d'environnement (cf. `.env.example`)
5. Connecter le domaine `mooreanews.com` dans Project Settings → Domains.

## Roadmap

### Phase 1 — MVP (actuelle)

- [x] Site multilingue + design polynésien
- [x] Widgets live : météo, ferries, soleil/lune, marées
- [x] Pages : événements, annonces, restaurants, activités, infos pratiques
- [x] Formulaire de soumission + notifications Telegram + email
- [x] Newsletter
- [x] SEO de base

### Phase 2 — Communauté

- [ ] Auth utilisateurs (Supabase Auth)
- [ ] Base de données Postgres (Supabase)
- [ ] Interface admin de modération web
- [ ] Galerie photos par publication
- [ ] Compte commerçant avec mise en avant

### Phase 3 — Automatisation

- [ ] Agrégation RSS (Tahiti Infos, Polynésie 1ère, Mairie de Moorea)
- [ ] Import auto d'événements depuis Facebook Pages publiques
- [ ] Calendrier centralisé
- [ ] Vercel Cron toutes les heures
- [ ] Filtrage IA anti-spam (OpenAI Moderation API)

### Phase 4 — Premium

- [ ] PWA installable (iOS/Android)
- [ ] Notifications push web (alertes événements, météo, coupures)
- [ ] Carte interactive Leaflet avec marqueurs
- [ ] API publique
- [ ] Dashboard stats

## Crédits

- Horaires ferries : [horaires-tahiti.com](https://www.horaires-tahiti.com/)
- Météo : [OpenWeatherMap](https://openweathermap.org/)
- Soleil/Lune : [sunrise-sunset.org](https://sunrise-sunset.org/)
- Images : Unsplash (à remplacer par photos locales)

## Licence

Tous droits réservés.

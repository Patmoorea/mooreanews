# MooreaNews — Application native (Android & macOS)

Application **Capacitor** qui affiche le résumé quotidien (`/app`) et renvoie vers **mooreanews.com** pour le contenu complet — afin de conserver le trafic sur le site.

## Principe

- **Écran d'accueil app** : ferries, météo, lagon, alertes, titres (page `/app`)
- **Clic sur une carte** → ouverture de la page complète sur mooreanews.com (dans la WebView)
- Pas de republication intégrale du contenu dans l'app

## Prérequis

- Node.js 20+
- **Android** : Android Studio + SDK
- **macOS** : Xcode (optionnel pour iOS) ou build Electron pour bureau

## Installation

```bash
cd apps/mooreanews-app
npm install
npx cap add android
npx cap add @capacitor-community/electron
npx cap sync
```

## Développement

L'app charge par défaut `https://www.mooreanews.com/app`.

Pour pointer vers un environnement local :

```bash
MOOREANEWS_APP_URL=http://localhost:3000/app npx cap sync
```

## Build Android (APK debug)

```bash
npm run build:android
# APK : android/app/build/outputs/apk/debug/app-debug.apk
```

Pour publier sur Google Play : signer l'APK/AAB (voir doc Android Studio).

## Build macOS (Electron)

```bash
npm run build:mac
```

Ouvre l'app bureau macOS qui encapsule la même WebView `/app`.

## PWA (alternative sans store)

Les utilisateurs peuvent aussi **installer depuis le navigateur** :

- Chrome Android → « Ajouter à l'écran d'accueil »
- Safari macOS → Partager → « Sur l'écran d'accueil »

Le site expose une PWA avec `start_url: /app`.

## Configuration

| Variable | Description |
|----------|-------------|
| `MOOREANEWS_APP_URL` | URL chargée par la WebView (défaut : prod `/app`) |

## Identifiant application

- **App ID** : `com.mooreanews.app`
- **Nom** : MooreaNews

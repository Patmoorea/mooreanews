# Ouvrir MooreaNews dans Android Studio — dépannage

## Erreur « tooling API version 2.14.1 »

Cette erreur apparaît quand Android Studio ouvre **le mauvais dossier** (ancien projet sur clé USB, dossier parent, Electron, etc.).

### Bon dossier à ouvrir

```
/Users/patricejourdan/Desktop/moorea-hub/apps/mooreanews-app/android
```

**Pas** `mooreanews-app`, **pas** `moorea-hub`, **pas** un projet sur `/Volumes/ASRNewVolume_...`.

### Procédure correcte

```bash
cd /Users/patricejourdan/Desktop/moorea-hub/apps/mooreanews-app
npm install
npx cap sync android
npx cap open android
```

Ou dans Android Studio : **File → Open** → sélectionner le dossier **`android`** ci-dessus.

Ne pas utiliser « Import Project from Gradle » sur un autre chemin.

---

## Erreur « Unsupported class file major version 69 »

Votre Mac utilise **Java 25** par défaut. Gradle / Android Gradle Plugin exigent **Java 17** (ou 21).

### Dans Android Studio

1. **Settings** (⌘,) → **Build, Execution, Deployment** → **Build Tools** → **Gradle**
2. **Gradle JDK** → choisir **temurin-17** (pas Java 25)
3. **Apply** → **Sync Project with Gradle Files** (icône éléphant)

> Capacitor 7 demande Java 21 en théorie ; ce projet force la **release 17** pour compatibilité avec le JDK installé sur votre Mac.

### En ligne de commande

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
cd apps/mooreanews-app/android
./gradlew assembleDebug
```

Ou le script tout-en-un :

```bash
chmod +x apps/mooreanews-app/scripts/build-android.sh
./apps/mooreanews-app/scripts/build-android.sh
```

APK généré : `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Prérequis

| Outil | Version |
|-------|---------|
| Android Studio | Ladybug (2024.2) ou plus récent |
| JDK | **17** (Temurin — pas Java 25 par défaut sur macOS) |
| Node.js | 20+ |

SDK Android : via Android Studio → SDK Manager → Android 14/15 (API 35).

---

## L’app charge le site

La WebView pointe vers `https://www.mooreanews.com/app`. Pas besoin de rebuild pour un changement de contenu web — seulement si vous modifiez le natif (permissions, icône, ID app).

Voir aussi `PLAY_STORE.md` pour la publication.

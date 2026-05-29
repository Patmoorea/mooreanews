# MooreaNews — Applications natives Android & iOS

Vraies apps **Capacitor** (APK / IPA), pas une simple PWA.  
Écran d’accueil = résumé `/app` → clic = site complet **mooreanews.com** (trafic conservé).

| Plateforme | Identifiant | Contenu |
|------------|-------------|---------|
| Android | `com.mooreanews.app` | WebView → `https://www.mooreanews.com/app` |
| iOS | `com.mooreanews.app` | Idem |

---

## Prérequis

```bash
cd apps/mooreanews-app
npm install
```

| Outil | Android | iOS |
|-------|---------|-----|
| JDK | **17** (pas Java 25) | — |
| Android Studio | Oui | — |
| Xcode (App Store) | — | Oui (Mac) |
| CocoaPods | — | `brew install cocoapods` |
| Compte dev | — | Apple Developer (99 USD/an) |

---

## Android — APK installable (test / sideload)

APK **réel**, installable sur téléphone (Paramètres → autoriser sources inconnues).

```bash
chmod +x scripts/build-android.sh
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
./scripts/build-android.sh
```

**Fichier produit :**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

Transférez sur le téléphone (AirDrop, USB, Google Drive) et installez.

### APK release signé (Play Store ou prod)

```bash
# 1. Créer le keystore (une seule fois)
keytool -genkey -v -keystore android/mooreanews-release.keystore \
  -alias mooreanews -keyalg RSA -keysize 2048 -validity 10000

# 2. Copier et remplir
cp android/keystore.properties.example android/keystore.properties

# 3. Builder
chmod +x scripts/build-android-release.sh
./scripts/build-android-release.sh apk    # → app-release.apk
./scripts/build-android-release.sh aab    # → app-release.aab (Play Store)
```

Voir aussi `ANDROID_STUDIO.md` et `PLAY_STORE.md`.

---

## iOS — vraie app iPhone / iPad

### 1. Installer Xcode

- App Store → **Xcode**
- Puis :
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### 2. Préparer et ouvrir le projet

```bash
chmod +x scripts/build-ios.sh
./scripts/build-ios.sh
```

Ouvre `ios/App/App.xcworkspace` dans Xcode.

### 3. Signer et générer l’IPA

Dans Xcode :

1. Cible **App** → **Signing & Capabilities** → choisir votre **Team** (Apple Developer)
2. Brancher un iPhone → **Run** (test direct)
3. **Product → Archive** → **Distribute App**
   - **App Store Connect** → publication App Store
   - **Ad Hoc** ou **Development** → IPA pour testeurs

Bundle ID : `com.mooreanews.app`  
Nom affiché : **MooreaNews**

---

## Commandes npm

```bash
npm run android          # Ouvre Android Studio
npm run ios              # Sync + ouvre Xcode
npm run build:apk        # APK debug
npm run build:release    # APK release signé
npm run build:aab        # Bundle Play Store
```

---

## Mises à jour

Le contenu web vient du site en ligne → **pas besoin de republier** l’app pour un changement d’article ou de ferry.

Republier seulement si vous changez :
- icône, splash, permissions
- `versionCode` / `versionName` (Android) ou version Xcode (iOS)
- identifiant `com.mooreanews.app`

Incrémenter dans `android/app/build.gradle` et Xcode **General → Version**.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Gradle tooling API 2.14 | Ouvrir le dossier `android/`, pas un vieux projet USB |
| Java version 69 | `Gradle JDK` = Java **17** dans Android Studio |
| pod install failed | Installer Xcode complet, pas CLI Tools seuls |
| Écran blanc au lancement | Vérifier que `mooreanews.com/app` est accessible |

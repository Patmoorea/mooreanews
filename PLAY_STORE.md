# Publication Google Play Store — MooreaNews

Application Android : `apps/mooreanews-app` (Capacitor, ID `com.mooreanews.app`).

## Principe produit

- L'app affiche le **résumé** (`/app`) : ferries, alertes, météo
- Un clic ouvre **mooreanews.com** pour le contenu complet → trafic conservé
- Politique de confidentialité : https://www.mooreanews.com/confidentialite

## Prérequis

1. Compte [Google Play Console](https://play.google.com/console) (25 USD unique)
2. Android Studio installé
3. Clés VAPID + Supabase configurés sur Vercel (push web + alertes quartier)

## 1. Générer les clés VAPID (push)

```bash
cd /chemin/vers/moorea-hub
npx web-push generate-vapid-keys
```

Ajouter sur **Vercel** :

| Variable | Description |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | Clé publique |
| `VAPID_PRIVATE_KEY` | Clé privée |
| `VAPID_SUBJECT` | `mailto:postmaster@mooreanews.com` |

Exécuter aussi `supabase/push-and-district-alerts.sql` dans Supabase.

## 2. Build release Android

```bash
cd apps/mooreanews-app
npm install
npx cap sync android
```

Dans Android Studio :

1. **Build → Generate Signed Bundle / APK** → **Android App Bundle (AAB)**
2. Créer un keystore (conserver le fichier `.jks` et mots de passe)
3. `versionCode` / `versionName` dans `android/app/build.gradle` à incrémenter à chaque release

## 3. Fiche Play Store

| Champ | Contenu suggéré |
|-------|-----------------|
| **Titre** | MooreaNews — Info île |
| **Description courte** | Ferries, alertes, météo Moorea. Le détail sur mooreanews.com |
| **Description** | MooreaNews est votre compagnon quotidien à Moorea : prochains ferries Tahiti↔Moorea, alertes par quartier (eau, EDT, route), météo et lagon. Résumé dans l'app, articles et agenda complets sur le site. |
| **Catégorie** | Actualités |
| **Email** | postmaster@mooreanews.com |
| **Politique confidentialité** | https://www.mooreanews.com/confidentialite |

### Captures d'écran

- Accueil `/app` (ferries + alertes)
- Page alertes avec quartiers
- Moorea du jour sur le site (navigateur in-app)

### Icône

Utiliser `public/brand/logo.png` → 512×512 PNG pour Play Store.

## 4. Digital Asset Links (optionnel TWA)

Fichier `public/.well-known/assetlinks.json` — remplacer `SHA256_CERT_FINGERPRINT` par l'empreinte du certificat de signature release :

```bash
keytool -list -v -keystore votre-keystore.jks -alias votre-alias
```

## 5. Checklist avant soumission

- [ ] SQL Supabase push exécuté
- [ ] VAPID sur Vercel
- [ ] Test push sur `/alertes` (Chrome Android ou app)
- [ ] AAB signé uploadé
- [ ] Politique confidentialité accessible
- [ ] `versionCode` incrémenté

## 6. macOS (App Store vs Electron)

- **Electron** (déjà dans le projet) : distribution hors Mac App Store, plus simple
- **Mac App Store** : compte Apple Developer (99 USD/an), notarisation — phase ultérieure

```bash
cd apps/mooreanews-app
npm run mac
```

## Mises à jour

1. Modifier le site (Vercel redeploy)
2. L'app Capacitor charge l'URL distante → **pas de resoumission** sauf changement natif (permissions, ID, splash)
3. Resoumettre Play Store si `versionCode` / permissions changent

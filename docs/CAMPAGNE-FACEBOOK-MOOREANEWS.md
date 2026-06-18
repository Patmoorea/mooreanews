# Campagne publicitaire Facebook — MooreaNews

Document prêt à l’emploi pour **Meta Ads Manager** (facebook.com/adsmanager).
Budget indicatif : **15 000–30 000 XPF / semaine** pour démarrer (ajustable).

---

## Objectif de campagne

| Paramètre | Valeur recommandée |
|-----------|-------------------|
| **Objectif Meta** | Trafic → Site web |
| **Optimisation** | Clics sur le lien |
| **KPI** | Visites site, pages vues, inscriptions newsletter |

---

## Ciblage géographique

**Emplacement :**
- Moorea (priorité)
- Tahiti (Papeete, Faa’a, Pirae, Arue, Punaauia)
- Rayonnement : personnes **intéressées par Moorea** ou **résidant en Polynésie française**

**Âge :** 18–65+  
**Langues :** Français  

**Audiences personnalisées (à créer) :**
1. **Visiteurs site 30 j** — pixel Meta / liste URL `mooreanews.com`
2. **Engagés Facebook** — personnes ayant interagi avec la Page MooreaNews (90 j)
3. **Lookalike 1 %** — à partir des visiteurs site (quand volume suffisant)

**Exclusions :** administrateurs / testeurs internes si besoin.

---

## Structure de campagne (3 ensembles de publicités)

### Ensemble 1 — Notoriété locale « L’info de Moorea »

**URL de destination :**
```
https://www.mooreanews.com/?utm_source=facebook&utm_medium=paid&utm_campaign=mooreanews_trafic_2026&utm_content=accueil
```

**Texte principal (FR) :**
```
🏝️ MooreaNews — toute l’actualité de Moorea en un seul site.

✅ Actualités & événements
✅ Horaires ferry Tahiti ↔ Moorea
✅ Météo, marées & alertes coupures
✅ Annonces locales & bons plans

L’info de l’île, en temps réel. Gratuit.
```

**Titre :** `MooreaNews — L'info de Moorea`  
**Description :** `Actualités, ferry, météo & alertes`  
**CTA :** En savoir plus  

**Visuel :** capture d’écran accueil + logo, ou bannière `/brand/banner.png` (1200×628 px).

---

### Ensemble 2 — Alertes temps réel (forte conversion locale)

**URL de destination :**
```
https://www.mooreanews.com/alertes-moorea?utm_source=facebook&utm_medium=paid&utm_campaign=mooreanews_trafic_2026&utm_content=alertes
```

**Texte principal :**
```
⚡ Alertes Moorea en direct sur votre téléphone.

Coupures EDT & eau · Ferry · Houle · Vigilance météo

Recevez l’info avant tout le monde — gratuit sur MooreaNews.
Partagez à votre famille sur l’île 👇
```

**Titre :** `Alertes Moorea — temps réel`  
**Description :** `Coupures, ferry, météo`  
**CTA :** S’inscrire (ou En savoir plus)  

**Visuel :** mockup téléphone sur page `/alertes-moorea`.

---

### Ensemble 3 — App Android (fidélisation)

**URL de destination :**
```
https://www.mooreanews.com/telecharger?utm_source=facebook&utm_medium=paid&utm_campaign=mooreanews_trafic_2026&utm_content=app_android
```

**Texte principal :**
```
📱 Téléchargez l’app MooreaNews (Android, gratuit).

Brief du matin, alertes ferry & actus Moorea — même hors du site.

Installez en 30 secondes ⬇️
```

**Titre :** `App MooreaNews — gratuit`  
**CTA :** Télécharger  

---

## Calendrier & budget suggéré

| Semaine | Focus | Budget XPF |
|---------|-------|------------|
| S1 | Ensemble 1 (accueil) — test A/B 2 visuels | 20 000 |
| S2 | Ensemble 2 (alertes) — booster le meilleur visuel S1 | 25 000 |
| S3 | Ensembles 1 + 2 actifs, couper le moins performant | 30 000 |
| S4 | Ajouter Ensemble 3 (app) si CPA acceptable | 25 000 |

**Règle :** si coût par clic > 150 XPF après 3 jours, changer le visuel ou le texte.

---

## Suivi des résultats

Les liens ci-dessus utilisent des **paramètres UTM** reconnus dans l’admin :

**Admin → Statistiques → Campagnes UTM (7 j)**

| utm_source | Signification |
|------------|---------------|
| `facebook` | Clics depuis Facebook (ads ou partages) |
| `whatsapp` | Partages WhatsApp |
| `instagram` | Stories / posts Instagram |

Vérifier aussi :
- **Vercel Analytics** — pays, appareils
- **Google Search Console** — recherches organiques (complément)

---

## Checklist avant de lancer

- [ ] Page Facebook MooreaNews à jour (photo couverture, lien site)
- [ ] Domaine vérifié dans Meta Business Suite
- [ ] Carte bancaire / mode de paiement Meta configuré
- [ ] `NEXT_PUBLIC_SITE_URL=https://www.mooreanews.com` sur Vercel
- [ ] Optionnel : `NEXT_PUBLIC_GOOGLE_BUSINESS_URL` = lien fiche Google Maps exacte

---

## Étapes dans Meta Ads Manager

1. **Créer une campagne** → Objectif **Trafic**
2. **Ensemble de publicités** → Ciblage géo ci-dessus
3. **Budget** → 3 000–5 000 XPF/jour pour commencer
4. **Publicité** → Coller texte + URL UTM + image 1200×628
5. **Publier** → Vérifier après 48 h dans Admin → Statistiques

---

## Variantes A/B à tester

| Élément | Version A | Version B |
|---------|-----------|-----------|
| Accroche | « L’info de Moorea en temps réel » | « Alertes ferry & coupures EDT » |
| Visuel | Photo lagon Moorea | Capture écran site |
| CTA | En savoir plus | S’inscrire |

---

## Contact & support

- Site : https://www.mooreanews.com  
- Facebook : https://www.facebook.com/MooreaNews  
- Mesure : `/admin/analytics` (connexion admin)

*Document généré pour MooreaNews — campagne trafic local Polynésie française.*

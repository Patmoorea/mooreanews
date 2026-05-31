# Alertes BREAKING — push + email quartier

**Déjà en place** sur MooreaNews. Voici comment l’utiliser pour coupure de route, ferry annulé, cyclone, etc.

---

## Créer une alerte instantanée (admin)

1. **Admin → Alertes → Nouvelle alerte**
2. Remplir :
   - **Titre** : court et factuel (ex. « Ferry Aremiti 14h annulé — mer agitée »)
   - **Détails** : source, conséquence, lien officiel
   - **Type** : `ferry`, `meteo`, `route`, etc.
   - **Quartier** : laisser vide = **toute l’île**, ou choisir un district
   - Cocher **Active**
   - Cocher **BREAKING NEWS (urgent)** ← indispensable pour le bandeau + newsletter
3. **Enregistrer**

→ **Push** immédiat aux abonnés du quartier (ou toute l’île)  
→ **Email** aux abonnés alertes email  
→ Si **urgent** : email aussi à la **newsletter** confirmée  
→ **Bandeau rouge** en haut du site (`BreakingNewsSlot`)

---

## Signalement communautaire → alerte

1. Un internaute envoie **Soumettre → Signalement** (`/soumettre`)
2. **Admin → Soumissions** → lire → **Approuver**
3. Une **alerte** est créée automatiquement
4. Pour du BREAKING : éditer l’alerte créée → cocher **urgent** → ou approuver avec type ferry/route/météo (voir ci-dessous)

Types de signalement rapides (formulaire `/signalements`) : route, ferry, méduse, resto complet, autre.

---

## Abonnés push / email quartier

Les visiteurs s’inscrivent sur **`/alertes`** :
- Choisir un ou plusieurs **quartiers**
- Activer **notifications push** (navigateur)
- Ou **email alertes**

Sans inscription = pas de push (normal).

---

## Prérequis prod

| Variable / SQL | Rôle |
|----------------|------|
| `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | Push Web |
| `RESEND_API_KEY` | Emails |
| `prod-setup-all.sql` | Tables `push_subscriptions`, `alert_email_subscriptions` |

Vérifier : **`/admin/setup`** tout vert pour Push + Resend.

---

## Vigilance cyclone (auto)

Le cron sync **meteo.pf** crée/met à jour une alerte météo. Les niveaux 3–5 sont marqués **urgents** automatiquement.

---

## Ferry annulé (semi-auto)

Les horaires **Aremiti / Vaeara'i** viennent des Firebase officiels. Si un départ est **annulé** ou **retardé**, MooreaNews affiche le statut sur la carte ferry et le bandeau mobile.

Pour une **alerte BREAKING** (push) : créer manuellement une alerte type `ferry` en admin — ou approuver un signalement communautaire.

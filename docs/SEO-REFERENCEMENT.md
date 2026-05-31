# Référencement — mooreanews.com & raitahiti.com

## Déjà en place (technique)

| Élément | MooreaNews | RAI TAHITI |
|---------|------------|------------|
| `sitemap.xml` | Oui (pages + contenus Supabase) | Oui (FR / EN / TY) |
| `robots.txt` | Oui | Oui |
| Canonique `www` | Redirection apex → www | Redirection apex → www |
| Open Graph / Twitter | Oui | Oui |
| JSON-LD (Schema.org) | WebSite + Organisation + lien RAI TAHITI | MedicalBusiness + LocalBusiness |
| `noindex` admin / auth / app | Oui | API exclue |

## Google Search Console (à faire une fois)

1. [search.google.com/search-console](https://search.google.com/search-console)
2. **Ajouter une propriété** pour chaque domaine :
   - `https://www.mooreanews.com`
   - `https://www.raitahiti.com`
3. Vérification par **balise HTML** :
   - Copier le code fourni par Google
   - Vercel → projet → **Environment Variables** :
     - MooreaNews : `GOOGLE_SITE_VERIFICATION=le_code_sans_guillemets`
     - RAI TAHITI : idem sur le projet raitahiti
   - Redéployer
4. **Soumettre le sitemap** :
   - `https://www.mooreanews.com/sitemap.xml`
   - `https://www.raitahiti.com/sitemap.xml`

## Bing Webmaster (optionnel)

Variable `BING_SITE_VERIFICATION` sur Vercel (MooreaNews).

## Vercel — variables recommandées

**MooreaNews**

```
NEXT_PUBLIC_SITE_URL=https://www.mooreanews.com
GOOGLE_SITE_VERIFICATION=...
```

**RAI TAHITI**

```
NEXT_PUBLIC_SITE_URL=https://www.raitahiti.com
GOOGLE_SITE_VERIFICATION=...
```

## Liens croisés (autorité locale)

- MooreaNews → fiche [RAI TAHITI](/infos-pratiques/rai-tahiti-vsl) + spotlight widget
- raitahiti.com → mention MooreaNews dans le footer (lien guide local)

## Contrôle rapide

```bash
curl -sI https://www.mooreanews.com/robots.txt
curl -s https://www.mooreanews.com/sitemap.xml | head
curl -sI https://mooreanews.com/   # doit rediriger 308 vers www
```

# Veille sources + agent IA local (oct. 2026)

## Diagnostic des flux « morts »

| Source | Cause | Correctif |
|---|---|---|
| Commune (`commune-moorea.net/feed/`) | Flux OK (HTTP 200) mais **plus aucun article publié sur le site depuis le 2 sept. 2025** : la commune communique sur Facebook. | Flux conservé (reprise possible). Relais via Google Actualités médias locaux. Page Facebook : nécessite un rôle sur la page (Graph API). |
| Polynésie La 1ère (`la1ere.francetvinfo.fr/polynesie/rss`) | Passage au domaine `la1ere.franceinfo.fr` : l’URL RSS **redirige (301) vers la page d’accueil HTML** → 0 item. Plus de RSS officiel. | Google Actualités `site:la1ere.franceinfo.fr`, lieux Moorea, 7 j, mot-clé dans le titre. |
| Présidence (`presidence.pf/feed/`) | `presidence.pf` **redirige vers `gouvernement.pf`**, qui n’a aucun flux (404). | Google Actualités `site:gouvernement.pf`, lieux Moorea, 30 j. |
| Google Actualités « Moorea Maiao Polynésie » | 3 mots **obligatoires** (ET) : presque aucun article ne contient « Maiao » → 0 résultat récent. | Requête en OU (Moorea, Maiao, Opunohu, Afareaitu, Haapiti, Papetoai, Paopao, Maharepa, Vaiare, Temae, Tiahura, Teavaro), `when:7d`, **médias polynésiens uniquement** (`LOCAL_MEDIA_DOMAINS`), mot-clé exigé dans le titre. Inclut TNTV, Radio1, Outremers360 (flux directs bloqués 403 / absents). |

## Agent IA (Mac, Ollama)

- `npm run ai:moorea` lit `external_articles` (72 h) des sources RSS **non auto-publiées** (Google Actualités Moorea, La 1ère, Gouvernement, coupures) ; exclut web-watch / facebook-watch (titres de pages d’accueil).
- Résout le lien Google Actualités → article du média, récupère le texte (og:description + paragraphes). **Pas de texte = pas de rédaction** (aucune invention à partir du seul titre).
- Ignore les sujets déjà publiés (titre similaire, 14 j).
- **Brouillons** par défaut (Admin → Articles, tag `ai-draft`). `AI_VEILLE_AUTO_PUBLISH=true` → publie quand l’IA juge l’info Moorea.
- Verrou anti-chevauchement, skip si mémoire libre < `AI_MIN_FREE_MEMORY_PCT` (35 %), modèle déchargé après 2 min (`OLLAMA_KEEP_ALIVE`).
- Planification : `bash scripts/install-ai-veille-launchd.sh <dossier> qwen2.5:14b` → toutes les 2 h, 6h20–20h20. Log : `~/Library/Logs/mooreanews-ai-veille.log`.

## Validation des brouillons IA par Telegram

Chaque brouillon IA arrive sur le bot admin **@Mooreanews_bot** (chat `TELEGRAM_CHAT_ID`) :

- **✅ Publier** → `published=true`, tag `ai-approved`, cache du site revalidé, post sur le canal public (comme les autres articles).
- **❌ Rejeter** → reste hors ligne, tag `ai-rejected` (jamais régénéré).
- **✏️ Plus tard** → reste en brouillon (tag `ai-later`), boutons Publier/Rejeter conservés.
- **📝 Modifier dans l’admin** → `/admin/articles/<id>` pour corriger avant de publier.

Commandes (chat admin uniquement) : `/brouillons`, `/publier <slug>`, `/rejeter <slug>`, `/aide_ia`.

Technique : les clics arrivent sur `/api/webhooks/telegram` (webhook déjà configuré pour @Mooreanews_bot). Toute action venant d’un autre chat que `TELEGRAM_CHAT_ID` est refusée.

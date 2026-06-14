# Signalements + Agent IA Moorea (Ollama local — gratuit)

## Pas d’OpenAI requis

L’agent IA tourne **sur votre Mac** via **Ollama** (comme OpenClaw).  
**Vercel prod** : pas de clé API, pas de facturation — l’étape `part=ai` du cron est ignorée.

---

## Architecture

| Où | IA |
|----|-----|
| **Mac (Ollama)** | Veille → brouillons + analyse signalements |
| **Vercel** | Signalements web/Telegram, veille RSS/FB, nettoyage coquilles |
| **OpenAI** | Optionnel uniquement si vous ajoutez `OPENAI_API_KEY` |

```
Mac : ollama serve → npm run ai:moorea → Supabase (brouillons ai-draft)
Vercel : /api/signalement, /api/webhooks/telegram, veille chainée
```

---

## 1. Signalements (`/signalements` + bot Telegram)

Voir sections précédentes. SQL : `supabase/signalement-telegram-ai.sql`  
Webhook : `GET /api/cron/telegram-webhook?secret=CRON_SECRET`

Analyse IA signalement : **async sur Mac** si vous lancez le traitement local, ou **skip** sur Vercel sans Ollama.

---

## 2. Agent IA veille (Mac + Ollama)

```bash
# Une fois
ollama pull llama3.2:3b

# À chaque run (ou cron Mac)
ollama serve   # si pas déjà lancé
cd ~/Desktop/moorea-hub
npm run ai:moorea
```

Variables `.env.local` (Mac) :

| Variable | Défaut |
|----------|--------|
| `OLLAMA_API_URL` | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | `llama3.2:3b` (ou `mistral-nemo:12b` comme OpenClaw) |
| `SUPABASE_SERVICE_ROLE_KEY` | requis pour écrire les brouillons |
| `TELEGRAM_*` | notif admin |

**Cron Mac** (5h–20h Tahiti) :

```cron
0 5-20 * * * cd /Users/patricejourdan/Desktop/moorea-hub && npm run ai:moorea >> /tmp/moorea-ai.log 2>&1
```

Modération : **Admin → Articles** (tag `ai-draft`).

---

## 3. Vercel (sans IA cloud)

Ne pas ajouter `OPENAI_API_KEY`.  
`/api/ai/status` → `"provider": "none"`, `"billing": "none"`.

GitHub veille : étape `part=ai` est **optionnelle** (ne bloque pas si IA off).

---

## 4. OpenAI (optionnel payant)

Uniquement si vous le souhaitez plus tard :

```
OPENAI_API_KEY=sk-...
AI_VEILLE_MODEL=gpt-4o-mini
```

Sinon, restez sur Ollama local.

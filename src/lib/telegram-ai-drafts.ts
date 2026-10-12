/**
 * Modération Telegram des brouillons de l’Agent IA Moorea.
 *
 * - Chaque brouillon IA est envoyé au chat admin (bot @Mooreanews_bot,
 *   TELEGRAM_BOT_TOKEN → TELEGRAM_CHAT_ID) avec 3 boutons :
 *   ✅ Publier · ❌ Rejeter · ✏️ Plus tard (+ lien « Modifier dans l’admin »).
 * - Commandes texte (chat admin uniquement) :
 *   /brouillons · /publier <slug|id> · /rejeter <slug|id> · /aide_ia
 * - Rejeter = garde la fiche non publiée, tag `ai-rejected` (jamais
 *   régénérée : le tag source `ai-src-…` reste en base).
 *
 * Sécurité : seules les actions venant du chat TELEGRAM_CHAT_ID sont acceptées.
 */

import { SITE } from "@/lib/constants";
import { getAdminBotToken } from "@/lib/telegram-config";
import { getAdminSupabase } from "@/lib/supabase/admin";

type InlineButton =
  | { text: string; callback_data: string }
  | { text: string; url: string };

type AdminCallbackQuery = {
  id: string;
  from: { id: number };
  message?: { chat: { id: number }; message_id: number; text?: string };
  data?: string;
};

type AdminMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
};

export type AiDraftUpdate = {
  message?: AdminMessage;
  callback_query?: AdminCallbackQuery;
};

export type AiDraftForReview = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category?: string | null;
  tags?: string[] | null;
};

const CB_PREFIX = "aid:";
const STATUS_TAGS = ["ai-draft", "ai-later", "ai-approved", "ai-rejected"];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function adminChatId(): string {
  return process.env.TELEGRAM_CHAT_ID?.trim() ?? "";
}

function isAdminChat(chatId: number | string | undefined): boolean {
  const admin = adminChatId();
  return Boolean(admin) && chatId !== undefined && String(chatId) === admin;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function adminApi<T = unknown>(
  method: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; result?: T; error?: string }> {
  const token = getAdminBotToken();
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN manquant" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      result?: T;
      description?: string;
    };
    if (!json.ok) return { ok: false, error: json.description ?? res.statusText };
    return { ok: true, result: json.result };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function adminEditUrl(id: string): string {
  return `${SITE.url.replace(/\/$/, "")}/admin/articles/${id}`;
}

function publicUrl(slug: string): string {
  return `${SITE.url.replace(/\/$/, "")}/actualites/${slug}`;
}

/** Markdown → texte brut court pour l’aperçu Telegram. */
function plainPreview(body: string, max = 700): { text: string; source?: { name: string; url: string } } {
  const m = body.match(/Source\s*:\s*\[([^\]]+)\]\((https?:[^)]+)\)/);
  const withoutSource = body.split(/\n-{3,}\n/)[0] ?? body;
  const text = withoutSource
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return {
    text: text.length > max ? `${text.slice(0, max).trimEnd()}…` : text,
    source: m ? { name: m[1], url: m[2] } : undefined,
  };
}

function reviewText(d: AiDraftForReview, status?: string): string {
  const { text, source } = plainPreview(d.body);
  const parts = [
    `🤖 <b>Brouillon IA</b>${d.category ? ` · ${esc(d.category)}` : ""}`,
    "",
    `<b>${esc(d.title)}</b>`,
    `<i>${esc(d.excerpt)}</i>`,
    "",
    esc(text),
  ];
  if (source) {
    parts.push("", `Source : <a href="${esc(source.url)}">${esc(source.name)}</a>`);
  }
  parts.push("", `<code>${esc(d.slug)}</code>`);
  if (status) parts.push("", status);
  return parts.join("\n").slice(0, 4000);
}

function reviewKeyboard(id: string): InlineButton[][] {
  return [
    [
      { text: "✅ Publier", callback_data: `${CB_PREFIX}p:${id}` },
      { text: "❌ Rejeter", callback_data: `${CB_PREFIX}r:${id}` },
    ],
    [{ text: "✏️ Plus tard", callback_data: `${CB_PREFIX}l:${id}` }],
    [{ text: "📝 Modifier dans l’admin", url: adminEditUrl(id) }],
  ];
}

/** Envoie un brouillon IA au chat admin avec les boutons de modération. */
export async function sendAiDraftForReview(
  d: AiDraftForReview,
): Promise<{ ok: boolean; error?: string }> {
  const chat = adminChatId();
  if (!chat) return { ok: false, error: "TELEGRAM_CHAT_ID manquant" };
  const r = await adminApi("sendMessage", {
    chat_id: chat,
    text: reviewText(d),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: reviewKeyboard(d.id) },
  });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

function nextTags(tags: string[] | null | undefined, status: string): string[] {
  return [...(tags ?? []).filter((t) => !STATUS_TAGS.includes(t)), status];
}

async function loadDraft(ref: string): Promise<AiDraftForReview & { published: boolean } | null> {
  const supabase = getAdminSupabase();
  if (!supabase) return null;
  const q = supabase
    .from("articles")
    .select("id, slug, title, excerpt, body, category, tags, published");
  const { data } = UUID_RE.test(ref)
    ? await q.eq("id", ref).maybeSingle()
    : await q.eq("slug", ref).maybeSingle();
  if (!data) return null;
  const tags = (data.tags as string[] | null) ?? [];
  // Uniquement les fiches produites par l’agent IA.
  if (!tags.includes("veille-ia")) return null;
  return data as AiDraftForReview & { published: boolean };
}

type ActionResult = { ok: boolean; message: string; draft?: AiDraftForReview; status?: string };

/** Hooks injectés par la route (revalidation Next, canal public). */
export type AiDraftHooks = {
  onPublished?: (d: { slug: string; title: string }) => Promise<void>;
};

async function publishDraft(ref: string, hooks?: AiDraftHooks): Promise<ActionResult> {
  const supabase = getAdminSupabase();
  const d = await loadDraft(ref);
  if (!supabase || !d) return { ok: false, message: "Brouillon introuvable" };
  if (d.published) {
    return { ok: true, message: "Déjà publié", draft: d, status: `✅ <b>Déjà en ligne</b> — ${publicUrl(d.slug)}` };
  }
  const { error } = await supabase
    .from("articles")
    .update({
      published: true,
      tags: nextTags(d.tags, "ai-approved"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", d.id);
  if (error) return { ok: false, message: `Erreur : ${error.message.slice(0, 120)}` };
  try {
    await hooks?.onPublished?.({ slug: d.slug, title: d.title });
  } catch {
    /* revalidation / canal : non bloquant */
  }
  return {
    ok: true,
    message: "Publié ✅",
    draft: d,
    status: `✅ <b>Publié</b> — ${publicUrl(d.slug)}`,
  };
}

async function rejectDraft(ref: string): Promise<ActionResult> {
  const supabase = getAdminSupabase();
  const d = await loadDraft(ref);
  if (!supabase || !d) return { ok: false, message: "Brouillon introuvable" };
  const { error } = await supabase
    .from("articles")
    .update({
      published: false,
      tags: nextTags(d.tags, "ai-rejected"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", d.id);
  if (error) return { ok: false, message: `Erreur : ${error.message.slice(0, 120)}` };
  return { ok: true, message: "Rejeté ❌", draft: d, status: "❌ <b>Rejeté</b> (gardé hors ligne, ne sera pas régénéré)" };
}

async function laterDraft(ref: string): Promise<ActionResult> {
  const supabase = getAdminSupabase();
  const d = await loadDraft(ref);
  if (!supabase || !d) return { ok: false, message: "Brouillon introuvable" };
  if (d.published) {
    return { ok: true, message: "Déjà publié", draft: d, status: `✅ <b>Déjà en ligne</b> — ${publicUrl(d.slug)}` };
  }
  await supabase
    .from("articles")
    .update({ tags: nextTags(d.tags, "ai-later"), updated_at: new Date().toISOString() })
    .eq("id", d.id);
  return {
    ok: true,
    message: "Gardé en brouillon ✏️",
    draft: d,
    status: "✏️ <b>Plus tard</b> — gardé en brouillon. /brouillons pour le retrouver.",
  };
}

async function listPendingDrafts(limit = 8): Promise<AiDraftForReview[]> {
  const supabase = getAdminSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, body, category, tags")
    .eq("published", false)
    .contains("tags", ["veille-ia"])
    .order("created_at", { ascending: false })
    .limit(40);
  return ((data ?? []) as AiDraftForReview[])
    .filter((a) => !(a.tags ?? []).includes("ai-rejected"))
    .slice(0, limit);
}

const HELP = [
  "🤖 <b>Brouillons IA MooreaNews</b>",
  "",
  "Boutons sous chaque brouillon : ✅ Publier · ❌ Rejeter · ✏️ Plus tard",
  "",
  "/brouillons — renvoie les brouillons en attente",
  "/publier &lt;slug&gt; — publie",
  "/rejeter &lt;slug&gt; — rejette (reste hors ligne)",
  "/aide_ia — cette aide",
].join("\n");

async function reply(chatId: number, text: string) {
  await adminApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

/**
 * Traite une mise à jour Telegram si elle concerne la modération IA.
 * Retourne true si traitée (la route ne doit alors pas la passer au bot signalements).
 */
export async function handleAiDraftModerationUpdate(
  update: AiDraftUpdate,
  hooks?: AiDraftHooks,
): Promise<boolean> {
  const cq = update.callback_query;
  if (cq?.data?.startsWith(CB_PREFIX)) {
    const chatId = cq.message?.chat.id;
    if (!isAdminChat(chatId)) {
      await adminApi("answerCallbackQuery", {
        callback_query_id: cq.id,
        text: "Non autorisé",
      });
      return true;
    }
    const [, action, id] = cq.data.split(":");
    const result =
      action === "p"
        ? await publishDraft(id, hooks)
        : action === "r"
          ? await rejectDraft(id)
          : action === "l"
            ? await laterDraft(id)
            : { ok: false, message: "Action inconnue" };

    await adminApi("answerCallbackQuery", {
      callback_query_id: cq.id,
      text: result.message,
    });

    if (result.draft && cq.message) {
      const keyboard: InlineButton[][] =
        action === "l"
          ? reviewKeyboard(result.draft.id).filter((row) => !row.some((b) => "callback_data" in b && b.callback_data.includes(":l:")))
          : action === "p"
            ? [[{ text: "🌐 Voir l’article", url: publicUrl(result.draft.slug) }]]
            : [];
      await adminApi("editMessageText", {
        chat_id: cq.message.chat.id,
        message_id: cq.message.message_id,
        text: reviewText(result.draft, result.status),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: keyboard },
      });
    }
    return true;
  }

  const msg = update.message;
  const text = msg?.text?.trim() ?? "";
  const m = text.match(/^\/(brouillons|publier|rejeter|aide_ia)(?:@\w+)?(?:\s+(\S+))?/i);
  if (!msg || !m) return false;
  if (!isAdminChat(msg.chat.id)) return false; // laisse le bot signalements gérer

  const cmd = m[1].toLowerCase();
  const arg = m[2];

  if (cmd === "aide_ia") {
    await reply(msg.chat.id, HELP);
    return true;
  }

  if (cmd === "brouillons") {
    const drafts = await listPendingDrafts();
    if (drafts.length === 0) {
      await reply(msg.chat.id, "Aucun brouillon IA en attente ✅");
      return true;
    }
    await reply(msg.chat.id, `🤖 ${drafts.length} brouillon(s) IA en attente :`);
    for (const d of drafts) await sendAiDraftForReview(d);
    return true;
  }

  if (!arg) {
    await reply(msg.chat.id, `Usage : /${cmd} &lt;slug&gt; (voir /brouillons)`);
    return true;
  }

  const result = cmd === "publier" ? await publishDraft(arg, hooks) : await rejectDraft(arg);
  await reply(
    msg.chat.id,
    result.status ?? esc(result.message),
  );
  return true;
}

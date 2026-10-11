/**
 * Récupère le texte d’un article source pour l’agent IA (évite de rédiger
 * à partir du seul titre → pas d’invention).
 * - Liens Google Actualités : résolution vers l’URL du média.
 * - Page article : og:description + paragraphes <p>.
 */

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export type FetchedArticle = {
  url: string;
  text: string;
  imageUrl: string | null;
};

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function meta(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return decode(m[1]).trim();
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2 ? decode(m2[1]).trim() : null;
}

export function isGoogleNewsUrl(url: string): boolean {
  return /^https?:\/\/news\.google\.com\/(rss\/)?articles\//i.test(url);
}

/** Résout un lien news.google.com/rss/articles/… vers l’URL de l’éditeur. */
export async function resolveGoogleNewsUrl(url: string): Promise<string | null> {
  try {
    const page = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!page.ok) return null;
    const html = await page.text();
    const id = html.match(/data-n-a-id="([^"]+)"/)?.[1];
    const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
    const sg = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
    if (!id || !ts || !sg) return null;

    const inner = `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${id}",${ts},"${sg}"]`;
    const body = `f.req=${encodeURIComponent(JSON.stringify([[["Fbv4je", inner]]]))}`;
    const res = await fetch(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": UA,
        },
        body,
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!res.ok) return null;
    const text = await res.text();
    const m = text.match(/garturlres\\",\\"(https?:[^"\\]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function extractParagraphs(html: string): string {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, " ");
  const scope =
    cleaned.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? cleaned;
  const paras: string[] = [];
  for (const m of scope.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = decode(m[1].replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    if (t.length < 40) continue;
    if (/cookie|abonnez|newsletter|javascript|tous droits/i.test(t)) continue;
    paras.push(t);
    if (paras.join("\n").length > 4000) break;
  }
  return paras.join("\n\n");
}

/** Texte exploitable de l’article (≥ 200 caractères), sinon null. */
export async function fetchArticleText(
  url: string,
): Promise<FetchedArticle | null> {
  let target = url;
  if (isGoogleNewsUrl(url)) {
    const resolved = await resolveGoogleNewsUrl(url);
    if (!resolved) return null;
    target = resolved;
  }
  try {
    const res = await fetch(target, {
      headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const desc = meta(html, "og:description") ?? meta(html, "description");
    const body = extractParagraphs(html);
    const text = [desc, body].filter(Boolean).join("\n\n").slice(0, 4500);
    if (text.length < 200) return null;
    return {
      url: res.url || target,
      text,
      imageUrl: meta(html, "og:image"),
    };
  } catch {
    return null;
  }
}

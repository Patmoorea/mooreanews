/**
 * Parser RSS / Atom minimaliste sans dépendance externe.
 * Gère les flux RSS 2.0 et Atom 1.0.
 */

export type RssItem = {
  guid: string;
  title: string;
  link: string;
  description: string;
  publishedAt: string; // ISO
  author?: string;
  imageUrl?: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1").trim();
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(xml: string, tagName: string): string | null {
  const re = new RegExp(`<${tagName}(?:[^>]*)>([\\s\\S]*?)</${tagName}>`, "i");
  const m = xml.match(re);
  if (!m) return null;
  return decodeEntities(stripCdata(m[1]));
}

function extractAttr(xml: string, tagName: string, attr: string): string | null {
  const re = new RegExp(`<${tagName}[^>]*\\b${attr}=["']([^"']+)["']`, "i");
  const m = xml.match(re);
  return m ? decodeEntities(m[1]) : null;
}

function findFirstImage(xml: string): string | undefined {
  // <enclosure url="…" type="image/…">
  const enclosure = xml.match(
    /<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\//i
  );
  if (enclosure) return enclosure[1];

  // <media:content url="…" medium="image">
  const media = xml.match(
    /<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["']/i
  );
  if (media) return media[1];

  // <img src="…"> dans la description
  const img = xml.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (img) return img[1];

  return undefined;
}

export async function fetchRssFeed(
  url: string,
  options?: { fresh?: boolean }
): Promise<RssItem[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "MooreaHub/1.0 (+https://mooreanews.com)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    },
    ...(options?.fresh ? { cache: "no-store" as const } : { next: { revalidate: 600 } }),
  });
  if (!res.ok) throw new Error(`RSS ${url}: HTTP ${res.status}`);
  const xml = await res.text();
  return parseRss(xml);
}

function parseRss(xml: string): RssItem[] {
  const isAtom = /<feed[^>]*xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom/i.test(xml);

  const itemRegex = isAtom
    ? /<entry\b[\s\S]*?<\/entry>/gi
    : /<item\b[\s\S]*?<\/item>/gi;

  const items: RssItem[] = [];
  const matches = xml.match(itemRegex) ?? [];

  for (const raw of matches) {
    const title = extractTag(raw, "title") ?? "";
    const description =
      extractTag(raw, "description") ??
      extractTag(raw, "summary") ??
      extractTag(raw, "content") ??
      "";
    const link = isAtom
      ? extractAttr(raw, "link", "href") ?? ""
      : extractTag(raw, "link") ?? "";
    const guid =
      extractTag(raw, "guid") ?? extractTag(raw, "id") ?? link ?? title;
    const pubDate =
      extractTag(raw, "pubDate") ??
      extractTag(raw, "published") ??
      extractTag(raw, "updated") ??
      new Date().toISOString();
    const author =
      extractTag(raw, "dc:creator") ??
      extractTag(raw, "author") ??
      undefined;
    const imageUrl = findFirstImage(raw);

    if (!title || !link) continue;

    items.push({
      guid: guid.trim(),
      title: stripTags(title),
      link: link.trim(),
      description: stripTags(description).slice(0, 400),
      publishedAt: new Date(pubDate).toISOString(),
      author: author ? stripTags(author) : undefined,
      imageUrl,
    });
  }

  return items;
}

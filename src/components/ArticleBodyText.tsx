import type { ReactNode } from "react";

/**
 * Corps d’article en paragraphes (texte brut + liens Markdown simples).
 * Les imports RSS / IA finissent par « --- » + « Source : [Nom](url) » :
 * on masque le séparateur et on rend le lien cliquable au lieu du Markdown brut.
 */
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    out.push(
      <a
        key={`${i}-${m[2]}`}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lagon-700 underline underline-offset-2 hover:text-tiare-600"
      >
        {m[1]}
      </a>,
    );
    last = i + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function ArticleBodyText({ body }: { body: string }) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !/^[-*_]{3,}$/.test(p))
    .map((p) =>
      // « ---\n*Source : …* » collé dans le même bloc
      p.replace(/^[-*_]{3,}\s*\n/, "").replace(/^\*(Source\s*:[\s\S]*)\*$/, "$1"),
    );
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i} className="text-lg leading-relaxed text-ocean-900 mb-6">
          {renderInline(para)}
        </p>
      ))}
    </>
  );
}

/** Tags techniques (pipeline) à ne pas afficher publiquement. */
export function publicArticleTags(tags: string[] | null | undefined): string[] {
  return (tags ?? []).filter(
    (t) =>
      !/^(ai-|veille-ia$|rss-import$|facebook-og$|moorea-news-fb$|commune-moorea$|google-news-|polynesie-1ere$|presidence-pf$|tahiti-infos$)/.test(
        t,
      ),
  );
}

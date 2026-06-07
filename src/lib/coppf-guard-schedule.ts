/**
 * Planning officiel médecins / pharmacies de garde —
 * Conseil de l'Ordre des Pharmaciens de Polynésie française (COPPF).
 * Tour de garde publié sur ordre-pharmaciens-polynesie.com (API WordPress).
 */

const COPPF_ORIGIN = "https://www.ordre-pharmaciens-polynesie.com";
const COPPF_API = `${COPPF_ORIGIN}/wp-json/wp/v2/pages`;

const FETCH_HEADERS = {
  Accept: "application/json",
  "User-Agent": "MooreaNews/1.0 (+https://www.mooreanews.com; COPPF garde sync)",
};

export type OfficialGuardSchedule = {
  title: string;
  pageUrl: string;
  updatedAt: string;
  images: { label: string; imageUrl: string }[];
};

type WpPage = {
  title: { rendered: string };
  link: string;
  modified: string;
  content: { rendered: string };
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Extrait les URLs d’images du contenu Divi (et_pb_image src=…). */
function extractUploadImages(html: string): string[] {
  const urls = new Set<string>();
  const re =
    /https:\/\/www\.ordre-pharmaciens-polynesie\.com\/wp-content\/uploads\/[\w./_-]+\.(?:jpg|jpeg|png|webp)/gi;
  for (const m of html.matchAll(re)) {
    urls.add(m[0]);
  }
  return [...urls];
}

async function fetchCoppfPage(slug: string): Promise<OfficialGuardSchedule | null> {
  try {
    const res = await fetch(`${COPPF_API}?slug=${encodeURIComponent(slug)}`, {
      headers: FETCH_HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const pages = (await res.json()) as WpPage[];
    const page = pages[0];
    if (!page) return null;

    const images = extractUploadImages(page.content.rendered).map((imageUrl, i) => ({
      label:
        slug === "medecins-de-garde"
          ? "Tour de garde officiel — médecins généralistes"
          : `Pharmacies de garde — secteur ${i + 1}`,
      imageUrl,
    }));

    if (images.length === 0) return null;

    return {
      title: stripHtml(page.title.rendered),
      pageUrl: page.link,
      updatedAt: page.modified,
      images,
    };
  } catch {
    return null;
  }
}

/** Planning hebdomadaire officiel des médecins de garde (toute la PF, ligne Moorea sur l’affiche). */
export async function fetchCoppfDoctorSchedule(): Promise<OfficialGuardSchedule | null> {
  return fetchCoppfPage("medecins-de-garde");
}

/** Pharmacies de garde Tahiti (Papeete, Faa’a, Punaauia) — référence officielle. */
export async function fetchCoppfPharmacySchedule(): Promise<OfficialGuardSchedule | null> {
  return fetchCoppfPage("pharmacies-de-garde");
}

export const COPPF_SOURCES = {
  doctors: `${COPPF_ORIGIN}/medecins-de-garde/`,
  pharmacies: `${COPPF_ORIGIN}/pharmacies-de-garde/`,
  home: COPPF_ORIGIN,
} as const;

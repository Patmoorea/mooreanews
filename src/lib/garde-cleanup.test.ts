import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  isCommuneGardeSourceUrl,
  isPlausibleGardeDates,
  stripCommuneMention,
  stripUnverifiedPharmacyParagraph,
} from "./garde-cleanup";
import { buildGardeArticleBody, buildGardeArticleExcerpt } from "./garde-weekend-article";
import { defaultMooreaPharmacyHours } from "./garde-announcement-parse";
import { snapshotToPublicDuties } from "./garde-moorea-auto";
import { HEALTH_ON_CALL_SOURCES } from "./health-on-call";
import { pickPublicGardePosterUrl } from "./garde-poster-url";

const now = new Date("2026-10-17T08:00:00-10:00");

describe("dates de garde plausibles", () => {
  it("accepte le week-end en cours", () => {
    assert.equal(isPlausibleGardeDates("2026-10-17", "2026-10-18", now), true);
  });
  it("refuse « Jour férié 12 septembre 2028 »", () => {
    assert.equal(isPlausibleGardeDates("2028-09-12", "2028-09-12", now), false);
  });
  it("refuse un jour de semaine non férié", () => {
    assert.equal(isPlausibleGardeDates("2026-10-21", "2026-10-21", now), false);
  });
  it("accepte la Toussaint (férié)", () => {
    assert.equal(isPlausibleGardeDates("2026-11-01", "2026-11-01", new Date("2026-10-29T08:00:00-10:00")), true);
  });
});

describe("pharmacies non vérifiées", () => {
  it("aucune liste de pharmacies par défaut", () => {
    assert.deepEqual(defaultMooreaPharmacyHours(), []);
  });
  it("le corps d'article généré ne contient plus Paopao/Tiahura ni 40 56 41 16", () => {
    const body = buildGardeArticleBody({
      validFrom: "2026-10-17",
      validTo: "2026-10-18",
      label: "Samedi 17 / Dimanche 18 octobre 2026",
      doctor: { name: "Dr BUONAMINI Sabrina", phone: "40 56 15 55", phoneHref: "tel:+68940561555" },
      pharmacy: null,
      pharmacyHours: [],
      syncedAt: now.toISOString(),
    });
    assert.doesNotMatch(body, /Paopao|Tiahura|40 56 41 16|Commune de Moorea-Maiao/);
    assert.match(body, /Ordre des médecins/);
  });
  it("nettoie un ancien article", () => {
    const old =
      "Informations de garde pour le week-end X, communiquées par la Commune de Moorea-Maiao.\n\nMédecin de garde : Dr A.\n\nHoraires pharmacies du week-end : Afareaitu (40 56 35 47) : — Paopao (40 55 20 75) : — Tiahura (40 56 41 16) : .\n\nAffiche MooreaNews générée à partir des informations officielles de la commune.";
    const out = stripCommuneMention(stripUnverifiedPharmacyParagraph(old));
    assert.doesNotMatch(out, /Paopao|Tiahura|Commune de Moorea-Maiao|de la commune/);
    assert.match(out, /Médecin de garde : Dr A\./);
  });
  it("extrait sans mention de la commune", () => {
    const ex = buildGardeArticleExcerpt({
      validFrom: "2026-10-17", validTo: "2026-10-18", label: "L", doctor: null, pharmacy: null, syncedAt: "",
    });
    assert.doesNotMatch(ex, /Commune/);
  });
});

const weekendSnap = {
  validFrom: "2026-10-17",
  validTo: "2026-10-18",
  label: "Samedi 17 / Dimanche 18 octobre 2026",
  doctor: { name: "Dr BUONAMINI Sabrina", phone: "40 56 15 55", phoneHref: "tel:+68940561555" },
  pharmacy: { name: "Pharmacie Tran", phone: "40 55 20 75", phoneHref: "tel:+68940552075" },
  pharmacyHours: [{ district: "Paopao", phone: "40 55 20 75", saturday: "9h-12h" }],
  syncedAt: now.toISOString(),
};

describe("pharmacie affichée seulement si la source est vérifiée", () => {
  it("masque une pharmacie lue sur la page de la commune", () => {
    const duties = snapshotToPublicDuties(
      {
        ...weekendSnap,
        sourceUrl: "https://www.facebook.com/CommuneMooreaMaiao/posts/1",
      },
      now,
    );
    assert.equal(duties.pharmacy, null);
    assert.equal(duties.doctor?.name, "Dr BUONAMINI Sabrina");
  });

  it("masque une pharmacie accrochée au tableau des médecins", () => {
    const duties = snapshotToPublicDuties(
      {
        ...weekendSnap,
        sourceUrl: "https://www.ordre-pharmaciens-polynesie.com/medecins-de-garde/",
      },
      now,
    );
    assert.equal(duties.pharmacy, null);
    assert.equal(duties.doctor?.phone, "40 56 15 55");
  });

  it("affiche la pharmacie quand la page officielle des pharmacies la nomme", () => {
    const duties = snapshotToPublicDuties(
      {
        ...weekendSnap,
        sourceUrl: "https://www.ordre-pharmaciens-polynesie.com/pharmacies-de-garde/",
      },
      now,
    );
    assert.equal(duties.pharmacy?.name, "Pharmacie Tran");
  });
});

describe("sources publiques de la garde", () => {
  it("cite la DSP et le tour de garde officiel", () => {
    const blob = HEALTH_ON_CALL_SOURCES.map((s) => `${s.label} ${s.href}`).join("\n");
    assert.match(blob, /40 47 01 44/);
    assert.match(blob, /ordre-pharmaciens-polynesie\.com\/medecins-de-garde/);
    assert.doesNotMatch(blob, /facebook|Commune|commune-moorea/i);
  });

  it("le pied de page /sante-garde ne présente plus la commune comme source", () => {
    const src = readFileSync(new URL("../app/sante-garde/page.tsx", import.meta.url), "utf8");
    assert.match(src, /COPPF_MEDECINS_GARDE_URL/);
    assert.match(src, /40 47 01 44/);
    assert.doesNotMatch(src, /CommuneMoorea|Facebook de la commune|commune-moorea/);
  });

  it("le pipeline garde n'appelle plus Facebook commune, RSS commune ni leurs affiches", () => {
    const files = [
      "./garde-moorea-auto.ts",
      "./garde-site-articles.ts",
      "./garde-moorea-data.ts",
      "./health-on-call.ts",
    ];
    const src = files
      .map((f) => readFileSync(new URL(f, import.meta.url), "utf8"))
      .join("\n");
    assert.doesNotMatch(src, /listCommuneMooreaGraphPosts/);
    assert.doesNotMatch(src, /commune-moorea\.net/);
    assert.doesNotMatch(src, /CommuneMooreaMaiao/);
  });

  it("le helper Facebook partagé reste en place pour les autres veilles", () => {
    const src = readFileSync(new URL("./facebook-watch.ts", import.meta.url), "utf8");
    assert.match(src, /export async function listCommuneMooreaGraphPosts/);
    assert.match(src, /export async function listMooreaNewsGraphPosts/);
  });

  it("refuse une affiche commune ou Facebook comme visuel public", () => {
    assert.equal(
      pickPublicGardePosterUrl(
        "https://scontent.xx.fbcdn.net/v/garde.jpg",
        "https://www.facebook.com/CommuneMooreaMaiao/photos/1",
        "https://www.ordre-pharmaciens-polynesie.com/wp-content/uploads/2026/10/SEM42.jpg",
        "https://example.supabase.co/storage/v1/object/public/media/generated/garde-weekend/garde.png",
      ),
      "https://example.supabase.co/storage/v1/object/public/media/generated/garde-weekend/garde.png",
    );
    assert.equal(isCommuneGardeSourceUrl("https://www.commune-moorea.net/feed/"), true);
    assert.equal(isCommuneGardeSourceUrl("https://www.ordre-pharmaciens-polynesie.com/medecins-de-garde/"), false);
  });
});

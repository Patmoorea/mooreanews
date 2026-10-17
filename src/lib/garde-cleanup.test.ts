import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPlausibleGardeDates,
  stripCommuneMention,
  stripUnverifiedPharmacyParagraph,
} from "./garde-cleanup";
import { buildGardeArticleBody, buildGardeArticleExcerpt } from "./garde-weekend-article";
import { defaultMooreaPharmacyHours } from "./garde-announcement-parse";

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

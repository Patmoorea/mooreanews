import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GARDE_CACHE_PAYLOAD_SOURCE_ID,
  GARDE_VEILLE_SOURCE_ID,
  buildGardeVeilleExcerpt,
  excerptForCard,
  externalArticleSourcesHiddenFromVeille,
  gardeCachePublicExcerpt,
  isGardeCacheSource,
  parseGardeSnapshotJson,
} from "./card-excerpt";

const buonanimi = {
  validFrom: "2026-10-17",
  validTo: "2026-10-18",
  label: "Samedi 17 / Dimanche 18 octobre 2026",
  doctor: {
    name: "BUONAMINI Sabrina",
    phone: "87 00 00 00",
    phoneHref: "tel:+68987000000",
  },
  pharmacy: null,
  articleSlug: "garde-moorea-2026-10-17",
  syncedAt: "2026-10-16T18:00:00.000Z",
  sourceUrl: "https://www.facebook.com/CommuneMooreaMaiao",
};

describe("buildGardeVeilleExcerpt", () => {
  it("décrit le week-end et le médecin", () => {
    assert.equal(
      buildGardeVeilleExcerpt(buonanimi),
      "Garde du 17 au 18 octobre : Dr BUONAMINI Sabrina",
    );
  });

  it("ne double pas le titre Dr", () => {
    assert.equal(
      buildGardeVeilleExcerpt({
        ...buonanimi,
        doctor: { name: "Dr BUONAMINI Sabrina" },
      }),
      "Garde du 17 au 18 octobre : Dr BUONAMINI Sabrina",
    );
  });

  it("ajoute la pharmacie quand elle est connue", () => {
    assert.equal(
      buildGardeVeilleExcerpt({
        ...buonanimi,
        pharmacy: { name: "Pharmacie de Paopao" },
      }),
      "Garde du 17 au 18 octobre : Dr BUONAMINI Sabrina · Pharmacie de Paopao",
    );
  });

  it("traite un jour férié d'une seule date", () => {
    assert.equal(
      buildGardeVeilleExcerpt({
        validFrom: "2026-07-14",
        validTo: "2026-07-14",
        doctor: { name: "Martin" },
      }),
      "Garde du 14 juillet : Dr Martin",
    );
  });

  it("précise l'année quand la garde change d'année", () => {
    assert.equal(
      buildGardeVeilleExcerpt({
        validFrom: "2026-12-31",
        validTo: "2027-01-01",
        doctor: { name: "Martin" },
      }),
      "Garde du 31 décembre 2026 au 1 janvier 2027 : Dr Martin",
    );
  });

  it("traverse deux mois", () => {
    assert.equal(
      buildGardeVeilleExcerpt({
        validFrom: "2026-10-31",
        validTo: "2026-11-01",
        doctor: { name: "Martin" },
      }),
      "Garde du 31 octobre au 1 novembre : Dr Martin",
    );
  });
});

describe("gardeCachePublicExcerpt", () => {
  it("n'enregistre pas le snapshot JSON dans l'extrait public", () => {
    const excerpt = gardeCachePublicExcerpt(buonanimi);
    assert.equal(excerpt.startsWith("{"), false);
    assert.equal(excerpt.includes("validFrom"), false);
    assert.equal(excerpt, "Garde du 17 au 18 octobre : Dr BUONAMINI Sabrina");
  });
});

describe("excerptForCard", () => {
  it("reformule le JSON de garde déjà stocké", () => {
    const raw = JSON.stringify({
      ...buonanimi,
      pharmacyHours: [{ district: "Paopao", phone: "40 56 00 00" }],
      doctorHours: { saturday: "8h-12h", sunday: "8h-12h" },
    });
    assert.equal(
      excerptForCard(raw),
      "Garde du 17 au 18 octobre : Dr BUONAMINI Sabrina",
    );
    const snap = parseGardeSnapshotJson(raw) as {
      articleSlug?: string;
      pharmacyHours?: Array<{ district: string }>;
      doctorHours?: { saturday?: string };
    } | null;
    assert.equal(snap?.articleSlug, "garde-moorea-2026-10-17");
    assert.equal(snap?.pharmacyHours?.[0]?.district, "Paopao");
    assert.equal(snap?.doctorHours?.saturday, "8h-12h");
    assert.equal(parseGardeSnapshotJson(gardeCachePublicExcerpt(buonanimi)), null);
  });

  it("reformule un JSON de garde coupé en fin de chaîne", () => {
    const raw = JSON.stringify(buonanimi).slice(0, 180);
    assert.equal(raw.endsWith("}"), false);
    assert.equal(
      excerptForCard(raw),
      "Garde du 17 au 18 octobre : Dr BUONAMINI Sabrina",
    );
    assert.equal(parseGardeSnapshotJson(raw), null);
  });

  it("masque un JSON qui n'est pas une garde", () => {
    assert.equal(excerptForCard('{"foo":"bar","n":1}'), null);
    assert.equal(excerptForCard('[{"validFrom":"2026-10-17"}]'), null);
  });

  it("laisse les textes de coupure Te Ito Rau intacts", () => {
    const samples = [
      "Coupure d'électricité programmée samedi 18 octobre à Paopao, de 8h à 12h.",
      "INFO COUPURE — Te Ito Rau no Moorea Maiao : secteur Maharepa dimanche matin.",
      "Travaux EDT sur le réseau de Haapiti. Plus d'infos sur la page Te Ito Rau.",
    ];
    for (const text of samples) {
      assert.equal(excerptForCard(text), text);
      assert.equal(parseGardeSnapshotJson(text), null);
    }
  });

  it("laisse un extrait d'actualité ordinaire intact", () => {
    const text = "Le marché de Paopao ouvre dimanche dès 5h.";
    assert.equal(excerptForCard(text), text);
    assert.equal(excerptForCard("  " + text + "  "), text);
    assert.equal(excerptForCard(""), null);
    assert.equal(excerptForCard(null), null);
  });
});

describe("sources de veille", () => {
  it("retire le payload JSON du bloc public sans toucher Te Ito Rau", () => {
    const hidden = externalArticleSourcesHiddenFromVeille([
      "emploi-service",
      "te-ito-rau-emploi",
    ]);
    assert.ok(hidden.includes(GARDE_CACHE_PAYLOAD_SOURCE_ID));
    assert.equal(hidden.includes("te-ito-rau"), false);
    assert.equal(hidden.includes(GARDE_VEILLE_SOURCE_ID), false);
    assert.equal(isGardeCacheSource(GARDE_CACHE_PAYLOAD_SOURCE_ID), true);
    assert.equal(isGardeCacheSource(GARDE_VEILLE_SOURCE_ID), true);
    assert.equal(isGardeCacheSource("te-ito-rau"), false);
    assert.equal(isGardeCacheSource("facebook-watch"), false);
  });
});

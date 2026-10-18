import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  GARDE_NEUTRAL_BAND,
  GARDE_SEASONAL_CALENDAR,
  gardeSeasonForIsoDate,
  gardeSeasonForMonth,
  type GardeSeasonBand,
} from "../data/garde-seasonal-calendar";
import {
  gardeDateColumn,
  gardeHourRows,
  gardeOnDutyPharmacyId,
  gardePharmacyRows,
  gardePosterLocation,
  gardePosterPhone,
  GARDE_IMAGE_CREDIT,
  GARDE_WEEKEND_POSTER_SIZE,
} from "./garde-weekend-poster-model";

function channels(hex: string): [number, number, number] {
  const raw = hex.replace("#", "");
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ];
}

/** Rose : rouge dominant, bleu présent, vert nettement plus bas. */
function isPink(hex: string): boolean {
  const [red, green, blue] = channels(hex);
  return red >= 160 && red > green + 50 && blue > green && blue < red;
}

function bandColors(band: GardeSeasonBand): string[] {
  return [band.background, band.color];
}

const sem42 = {
  validFrom: "2026-10-17",
  validTo: "2026-10-18",
  doctor: { name: "Dr BUONAMINI Sabrina", phone: "40 56 15 55" },
  doctorHours: { saturday: "12h00 – 18h00", sunday: "8h00 – 16h00" },
};

describe("calendrier du bandeau saisonnier", () => {
  it("Octobre Rose seulement en octobre", () => {
    for (let month = 1; month <= 12; month += 1) {
      const band = gardeSeasonForMonth(month);
      if (month === 10) {
        assert.equal(band.id, "octobre-rose");
        assert.equal(band.label, "Octobre Rose");
      } else {
        assert.notEqual(band.id, "octobre-rose");
      }
    }
    assert.equal(gardeSeasonForIsoDate("2026-10-17").id, "octobre-rose");
    assert.equal(gardeSeasonForIsoDate("2026-10-01").id, "octobre-rose");
    assert.equal(gardeSeasonForIsoDate("2026-10-31").id, "octobre-rose");
  });

  it("Novembre bleu en novembre, fêtes en décembre, neutre sinon", () => {
    assert.equal(gardeSeasonForMonth(11).id, "novembre-bleu");
    assert.equal(gardeSeasonForMonth(11).label, "Novembre bleu");
    assert.equal(gardeSeasonForIsoDate("2026-11-01").id, "novembre-bleu");
    assert.equal(gardeSeasonForMonth(12).id, "fetes");
    assert.equal(gardeSeasonForMonth(12).label, "Fêtes");
    assert.equal(gardeSeasonForIsoDate("2026-12-25").id, "fetes");
    for (const month of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      assert.equal(gardeSeasonForMonth(month).id, "neutral");
      assert.equal(gardeSeasonForMonth(month).label, "");
    }
    assert.deepEqual(gardeSeasonForIsoDate("2026-04-18"), GARDE_NEUTRAL_BAND);
    assert.equal(gardeSeasonForIsoDate("pas-une-date").id, "neutral");
  });

  it("le rose n'est présent que dans le bandeau Octobre Rose", () => {
    const rose = GARDE_SEASONAL_CALENDAR.find((band) => band.id === "octobre-rose");
    assert.ok(rose);
    assert.equal(isPink(rose.background), true);
    assert.equal(isPink(rose.color), false);

    for (const band of GARDE_SEASONAL_CALENDAR) {
      if (band.id === "octobre-rose") continue;
      for (const color of [band.background, band.color]) {
        assert.equal(isPink(color), false, `${band.id} ${color}`);
      }
    }
    for (const color of bandColors(GARDE_NEUTRAL_BAND)) {
      assert.equal(isPink(color), false, color);
    }

    const poster = readFileSync(new URL("./garde-weekend-poster.tsx", import.meta.url), "utf8");
    const posterHex = poster.match(/#[0-9A-Fa-f]{6}/g) ?? [];
    assert.ok(posterHex.length > 0);
    for (const hex of posterHex) {
      assert.equal(isPink(hex), false, hex);
    }
    assert.doesNotMatch(poster, /linear-gradient|radial-gradient/);
    assert.match(poster, /MooreaNews vous informe que le/);
    assert.match(poster, /GARDE_IMAGE_CREDIT/);
    assert.match(poster, /DE GARDE/);
    assert.deepEqual(GARDE_WEEKEND_POSTER_SIZE, { width: 1080, height: 1920 });
  });
});

describe("données affichées sur l'affiche", () => {
  it("colonne de dates SEM42 : 17 / 18, octobre", () => {
    assert.deepEqual(gardeDateColumn("2026-10-17", "2026-10-18"), {
      days: ["17", "18"],
      month: "octobre",
    });
  });

  it("horaires, téléphone, et pas de lieu si le tableau n'en donne pas", () => {
    assert.deepEqual(gardeHourRows(sem42), [
      { label: "Samedi", hours: "12h00 – 18h00" },
      { label: "Dimanche", hours: "8h00 – 16h00" },
    ]);
    assert.equal(gardePosterPhone(sem42), "40 56 15 55");
    assert.equal(gardePosterLocation(sem42), null);
    assert.equal(gardePosterLocation({ ...sem42, doctorAddress: "PK 5, Maharepa" }), "PK 5, Maharepa");
    assert.match(GARDE_IMAGE_CREDIT, /tableau de l'Ordre des médecins/);
  });

  it("badge DE GARDE seulement pour la pharmacie citée ce week-end", () => {
    assert.equal(gardeOnDutyPharmacyId(sem42), null);
    assert.equal(gardePharmacyRows(sem42).some((row) => row.onDuty), false);

    const tran = {
      ...sem42,
      pharmacyDuty: {
        pharmacyId: "pharmacie-tran-moorea",
        validFrom: "2026-10-17",
        validTo: "2026-10-18",
        sourceLabel: "Commune de Moorea-Maiao",
      },
    };
    assert.equal(gardeOnDutyPharmacyId(tran), "pharmacie-tran-moorea");
    const rows = gardePharmacyRows(tran);
    assert.deepEqual(
      rows.filter((row) => row.onDuty).map((row) => row.id),
      ["pharmacie-tran-moorea"],
    );
    assert.equal(rows.length, 3);
    assert.match(rows[1]?.saturday ?? "", /à confirmer/);

    const otherWeekend = {
      ...tran,
      pharmacyDuty: {
        ...tran.pharmacyDuty,
        validFrom: "2026-10-10",
        validTo: "2026-10-11",
      },
    };
    assert.equal(gardeOnDutyPharmacyId(otherWeekend), null);
  });
});

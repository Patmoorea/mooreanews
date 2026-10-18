import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { MOOREA_PHARMACIES, weekendPharmacyHoursParagraph } from "../data/pharmacies-moorea";
import { overlayPharmacyInfo } from "./moorea-pharmacies";
import {
  parsePharmacyDutyFromText,
  pharmacySourceLabel,
  selectPharmacyDuty,
  type PharmacyDuty,
} from "./garde-pharmacy-duty";
import type { InfoPratique } from "./content-types";

const now = new Date("2026-10-17T08:00:00-10:00");

const tranThisWeekend =
  "Pharmacie de garde samedi 17 octobre 2026 / dimanche 18 octobre 2026 : Pharmacie Tran à Paopao.";

describe("fichier des pharmacies de Moorea", () => {
  it("liste les trois officines avec les horaires vérifiés", () => {
    assert.deepEqual(
      MOOREA_PHARMACIES.map((pharmacy) => pharmacy.phone),
      ["40 56 35 47", "40 55 20 75", "40 56 41 16"],
    );
    const tran = MOOREA_PHARMACIES.find((pharmacy) => pharmacy.id === "pharmacie-tran-moorea");
    assert.equal(tran?.saturdayUnconfirmed, true);
    assert.match(tran?.hoursLabel ?? "", /horaires à confirmer/);
    assert.match(tran?.hoursLabel ?? "", /7h00–12h15 et 14h00–17h30/);
    const haapiti = MOOREA_PHARMACIES.find((pharmacy) => pharmacy.id === "pharmacie-moorea-haapiti");
    assert.match(haapiti?.hoursLabel ?? "", /8h00–16h30/);
    assert.match(haapiti?.address ?? "", /26,9/);
  });

  it("la ligne d'horaires du week-end n'est pas vide", () => {
    const line = weekendPharmacyHoursParagraph();
    assert.match(line, /Horaires pharmacies du week-end/);
    assert.match(line, /sam\. 7h30–13h30/);
    assert.match(line, /horaires à confirmer/);
    assert.doesNotMatch(line, /\)\s*:\s*(—|\.)/);
  });

  it("corrige les horaires faux déjà en base et ajoute les fiches manquantes", () => {
    const stale: InfoPratique[] = [
      {
        slug: "pharmacie-tran-paopao",
        title: "Pharmacie Tran — Paopao",
        description: "Ancienne fiche",
        category: "sante",
        address: "PK 6,5, Paopao",
        phone: "40 55 20 75",
        hours: "Lun–ven 7h–18h · sam 7h–12h30",
      },
      {
        slug: "pharmacie-haapiti",
        title: "Pharmacie Moorea Haapiti",
        description: "Ancienne fiche",
        category: "sante",
        phone: "40 56 41 16",
        hours: "Lun–ven 7h–18h · sam 7h–12h30",
      },
    ];
    const items = overlayPharmacyInfo(stale);
    const tran = items.find((item) => item.slug === "pharmacie-tran-paopao");
    const haapiti = items.find((item) => item.slug === "pharmacie-haapiti");
    const afareaitu = items.find((item) => item.slug === "pharmacie-afareaitu");
    assert.match(tran?.hours ?? "", /horaires à confirmer/);
    assert.match(tran?.hours ?? "", /14h00–17h30/);
    assert.equal(haapiti?.address, "PK 26,9, Tiahura");
    assert.match(haapiti?.hours ?? "", /9h00–12h30/);
    assert.equal(afareaitu?.phone, "40 56 35 47");
    assert.equal(items.filter((item) => item.slug.startsWith("pharmacie-")).length, 3);
  });
});

describe("pharmacie de garde : dates du week-end exigées", () => {
  it("retient Tran quand le samedi et le dimanche sont écrits", () => {
    const duty = parsePharmacyDutyFromText(tranThisWeekend, now);
    assert.equal(duty?.name, "Pharmacie Tran");
    assert.equal(duty?.validFrom, "2026-10-17");
    assert.equal(duty?.validTo, "2026-10-18");
  });

  it("refuse un week-end déjà passé", () => {
    const text =
      "Pharmacie de garde samedi 10 octobre 2026 / dimanche 11 octobre 2026 : Pharmacie Haapiti.";
    assert.equal(parsePharmacyDutyFromText(text, now), null);
  });

  it("refuse « ce week-end » sans dates", () => {
    assert.equal(
      parsePharmacyDutyFromText("La pharmacie de garde ce week-end est la pharmacie Tran.", now),
      null,
    );
  });

  it("refuse si deux officines sont désignées", () => {
    const text =
      "Pharmacie de garde samedi 17 octobre 2026 / dimanche 18 octobre 2026 : Tran ou Haapiti.";
    assert.equal(parsePharmacyDutyFromText(text, now), null);
  });

  it("ne prend pas le médecin pour une pharmacie", () => {
    const text =
      "Samedi 17 octobre 2026 / dimanche 18 octobre 2026. Médecin de garde : Dr BUONAMINI Sabrina, 40 56 15 55.";
    assert.equal(parsePharmacyDutyFromText(text, now), null);
  });

  it("deux sources en désaccord : rien n'est affiché", () => {
    const tran: PharmacyDuty = {
      pharmacyId: "pharmacie-tran-moorea",
      name: "Pharmacie Tran",
      phone: "40 55 20 75",
      phoneHref: "tel:+68940552075",
      validFrom: "2026-10-17",
      validTo: "2026-10-18",
      sourceUrl: "https://www.commune-moorea.net/garde",
      sourceLabel: "Commune de Moorea-Maiao",
    };
    const haapiti: PharmacyDuty = {
      ...tran,
      pharmacyId: "pharmacie-moorea-haapiti",
      name: "Pharmacie Haapiti",
      sourceUrl: "https://www.tntv.pf/garde",
      sourceLabel: "TNTV",
    };
    assert.equal(selectPharmacyDuty([tran, haapiti]), null);
    assert.equal(selectPharmacyDuty([tran])?.sourceLabel, "Commune de Moorea-Maiao");
  });

  it("reconnaît TNTV et la commune", () => {
    assert.equal(pharmacySourceLabel("https://www.tntv.pf/article", "Autre"), "TNTV");
    assert.equal(
      pharmacySourceLabel("https://www.commune-moorea.net/feed/", "Autre"),
      "Commune de Moorea-Maiao",
    );
  });

  it("le module pharmacie relit la commune, les fichiers du médecin non", () => {
    const pharmacy = readFileSync(new URL("./garde-pharmacy-duty.ts", import.meta.url), "utf8");
    assert.match(pharmacy, /listCommuneMooreaGraphPosts/);
    assert.match(pharmacy, /commune-moorea\.net/);
    const doctor = readFileSync(new URL("./garde-official-table.ts", import.meta.url), "utf8");
    assert.doesNotMatch(doctor, /listCommuneMooreaGraphPosts|commune-moorea\.net/);
  });
});

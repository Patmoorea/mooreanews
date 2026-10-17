import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isCommuneGardePosterText,
  parseCommuneGardePosterText,
} from "./garde-commune-poster";
import { collapseAlternatePhones } from "./garde-announcement-parse";

// Texte tel que lu sur l'affiche commune du 17-18/10/2026.
const COMMUNE_OCR = `COMMUNE DE MOOREA-MAIAO
MÉDECIN DE GARDE
— MOOREA —
La Commune de Moorea-Maiao vous informe que
le Dr BUONAMINI Sabrina assurera la permanence médicale :
SAMEDI 17 OCTOBRE
12h00 – 18h00
DIMANCHE 18 OCTOBRE
8h00 – 16h00
HAAPITI
PK 30,5 côté montagne
40 56 15 55
HORAIRES DES PHARMACIES
PHARMACIE D'AFAREAITU
40 56 35 47
Samedi : 7h30 – 13h30
Dimanche : 7h30 – 11h30
PHARMACIE DE MAHAREPA
40 55 20 75
Samedi : 7h30 – 12h15
et 14h30 – 16h30
Dimanche : 8h00 – 11h00
PHARMACIE DE HAAPITI
40 56 38 37
Samedi : 8h00 – 12h00
Dimanche : 8h00 – 10h00
#MooreaMaiao #MédecinDeGarde`;

describe("affiche commune Moorea-Maiao", () => {
  it("reconnaît l'affiche commune, pas le tableau COPPF", () => {
    assert.equal(isCommuneGardePosterText(COMMUNE_OCR), true);
    assert.equal(
      isCommuneGardePosterText(
        "TOUR DE GARDE OFFICIEL DES MÉDECINS Moorea Dr BUONAMINI Bora-Bora pharmacie",
      ),
      false,
    );
  });

  it("extrait médecin, horaires, lieu, téléphone", () => {
    const p = parseCommuneGardePosterText(COMMUNE_OCR)!;
    assert.equal(p.doctor.name, "Dr BUONAMINI Sabrina");
    assert.equal(p.doctor.phone, "40 56 15 55");
    assert.equal(p.doctor.phoneHref, "tel:+68940561555");
    assert.equal(p.doctorAddress, "Haapiti, PK 30,5 côté montagne");
    assert.deepEqual(p.doctorHours, { saturday: "12h00 – 18h00", sunday: "8h00 – 16h00" });
    assert.equal(p.days.saturday, "SAMEDI 17 OCTOBRE");
  });

  it("extrait les horaires des 3 pharmacies (y compris coupure midi)", () => {
    const p = parseCommuneGardePosterText(COMMUNE_OCR)!;
    assert.deepEqual(p.pharmacyHours, [
      { district: "Afareaitu", phone: "40 56 35 47", saturday: "7h30 – 13h30", sunday: "7h30 – 11h30" },
      {
        district: "Maharepa",
        phone: "40 55 20 75",
        saturday: "7h30 – 12h15 et 14h30 – 16h30",
        sunday: "8h00 – 11h00",
      },
      { district: "Haapiti", phone: "40 56 38 37", saturday: "8h00 – 12h00", sunday: "8h00 – 10h00" },
    ]);
  });
});

describe("tableau COPPF — numéros alignés", () => {
  it("fusionne « 40 80 00 80 / 87 77 75 37 » pour ne pas décaler les lignes", () => {
    const text = "40 80 00 80 / 87 77 75 37\n40 50 70 70\n89 40 02 50";
    const phones = [...text.matchAll(/\b((?:40|87|89)(?:[ .\-]?\d{2}){3})\b/g)].map((m) => ({
      phone: m[1]!,
      pos: m.index ?? 0,
    }));
    assert.deepEqual(
      collapseAlternatePhones(text, phones).map((p) => p.phone),
      ["40 80 00 80", "40 50 70 70", "89 40 02 50"],
    );
  });
});

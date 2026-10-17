import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  expectedWeekend,
  parseOfficialMooreaGarde,
  validateOfficialMooreaGarde,
} from "./garde-official-table";
import { parseCoppfMooreaGarde } from "./garde-announcement-parse";

const fx = (f: string) =>
  readFileSync(path.join(__dirname, "__fixtures__/garde", f), "utf8");

// Vraies affiches officielles (OCR.space), SEM38 → SEM42 2026, vérifiées sur les images.
const WEEKS = [
  { w: 38, from: "2026-09-19", to: "2026-09-20", doc: "Dr GOEURIOT Julien", phone: "40 56 26 19" },
  { w: 39, from: "2026-09-26", to: "2026-09-27", doc: "Dr APPIETTO Audrey", phone: "40 56 27 07" },
  { w: 40, from: "2026-10-03", to: "2026-10-04", doc: "Dr GARLING", phone: "40 56 30 31" },
  { w: 41, from: "2026-10-10", to: "2026-10-11", doc: "Dr BOUCHET Nicolas", phone: "40 56 47 47" },
  { w: 42, from: "2026-10-17", to: "2026-10-18", doc: "Dr BUONAMINI Sabrina", phone: "40 56 15 55" },
];

describe("tour de garde officiel — ligne Moorea, 5 semaines réelles", () => {
  for (const wk of WEEKS) {
    for (const mode of ["table", "plain"] as const) {
      it(`SEM${wk.w} (${mode})`, () => {
        const g = parseOfficialMooreaGarde(fx(`sem${wk.w}-${mode}.txt`));
        assert.ok(g, "ligne Moorea trouvée");
        assert.equal(g.doctorName, wk.doc);
        assert.equal(g.phone, wk.phone);
        assert.equal(g.week, wk.w);
        assert.equal(g.validFrom, wk.from);
        assert.equal(g.validTo, wk.to);
        assert.equal(g.saturday, "12h00 – 18h00");
        assert.equal(g.sunday, "8h00 – 16h00");
        const now = new Date(`${wk.from}T08:00:00-10:00`);
        const v = validateOfficialMooreaGarde(g, now);
        assert.deepEqual(v.issues, []);
      });
    }
  }

  it("régression : l'ancien parseur donnait le n° de Taravao en SEM42", () => {
    const old = parseCoppfMooreaGarde(fx("sem42-plain.txt"));
    // Avant correctif : 40 57 51 57 (ligne « 40 80 00 80 / 87 77 75 37 » comptée double).
    assert.equal(old?.doctor?.phone, "40 56 15 55");
  });
});

describe("validation — refuse les données incohérentes", () => {
  const base = parseOfficialMooreaGarde(fx("sem42-table.txt"))!;
  const now = new Date("2026-10-16T09:00:00-10:00");

  it("accepte la SEM42 la veille du week-end", () => {
    assert.equal(validateOfficialMooreaGarde(base, now).ok, true);
  });
  it("refuse un n° fixe hors Moorea (décalage de ligne)", () => {
    const v = validateOfficialMooreaGarde({ ...base, phone: "40 57 51 57" }, now);
    assert.equal(v.ok, false);
    assert.match(v.issues.join(), /hors Moorea/);
  });
  it("refuse un n° qui appartient à une autre ligne", () => {
    const v = validateOfficialMooreaGarde({ ...base, phone: "87 25 81 18" }, now);
    assert.match(v.issues.join(), /autre ligne/);
  });
  it("refuse un médecin d'un autre secteur", () => {
    const v = validateOfficialMooreaGarde({ ...base, doctorName: "Dr HINGANT Martin" }, now);
    assert.match(v.issues.join(), /autre ligne/);
  });
  it("refuse des horaires absents", () => {
    const v = validateOfficialMooreaGarde({ ...base, saturday: undefined, sunday: undefined }, now);
    assert.match(v.issues.join(), /horaires/);
  });
  it("refuse l'affiche d'une autre semaine", () => {
    const v = validateOfficialMooreaGarde(base, new Date("2026-10-22T09:00:00-10:00"));
    assert.match(v.issues.join(), /week-end attendu/);
  });
  it("week-end attendu : dimanche = week-end en cours", () => {
    assert.deepEqual(expectedWeekend(new Date("2026-10-18T20:00:00-10:00")), {
      validFrom: "2026-10-17",
      validTo: "2026-10-18",
    });
  });
});

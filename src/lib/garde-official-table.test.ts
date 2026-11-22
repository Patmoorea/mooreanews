import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  expectedGardePeriod,
  expectedWeekend,
  parseOfficialMooreaGarde,
  parseOfficialWeek,
  phoneDigits,
  validateOfficialMooreaGarde,
  weekendOfIsoWeek,
} from "./garde-official-table";
import { gardePublishMismatch, gardeRunShouldFail } from "./garde-sync-verdict";
import {
  holidayDatesFromFilename,
  isListedWeekdayHolidayRoster,
} from "./garde-ordre-pharmaciens";
import { pickBestGardeSnapshot } from "./garde-moorea-data";
import { pickOfficialOcrCandidate, type GardeMooreaSnapshot } from "./garde-moorea-auto";
import { gardeArticleSlug } from "./garde-weekend-article";
import {
  mergeGardeOcrIntoSnapshot,
  parseCoppfMooreaGarde,
  parseWeekendDatesFromText,
} from "./garde-announcement-parse";
import { parseCoppfGardeImagesFromHtml } from "./garde-ordre-pharmaciens";
import { ensureGardeDates, validateGardeBeforePublish } from "./garde-moorea-auto";

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
    assert.match(v.issues.join(), /période attendue/);
  });
  it("week-end attendu : dimanche = week-end en cours", () => {
    assert.deepEqual(expectedWeekend(new Date("2026-10-18T20:00:00-10:00")), {
      validFrom: "2026-10-17",
      validTo: "2026-10-18",
    });
  });
});

// SEM44 (31/10–01/11/2026, dimanche férié) : vraie affiche COPPF publiée en capture
// d'écran JPG (Screenshot_20261031_004112_Samsung-Browser-1.jpg), n° imprimé « 87 000 800 ».
describe("SEM44 — capture d'écran, n° groupé 2-3-3", () => {
  for (const mode of ["table", "plain"] as const) {
    it(`SEM44 (${mode}) : Dr FOUGEROUSE, 87 000 800, sam 12h–18h, dim/férié 8h–16h`, () => {
      const g = parseOfficialMooreaGarde(fx(`sem44-${mode}.txt`));
      assert.ok(g, "ligne Moorea trouvée");
      assert.equal(g.doctorName, "Dr FOUGEROUSE Pierre-Antoine");
      assert.equal(g.phone, "87 000 800");
      assert.equal(g.week, 44);
      assert.equal(g.validFrom, "2026-10-31");
      assert.equal(g.validTo, "2026-11-01");
      assert.equal(g.saturday, "12h00 – 18h00");
      assert.equal(g.sunday, "8h00 – 16h00");
      const v = validateOfficialMooreaGarde(g, new Date("2026-10-30T14:00:00-10:00"));
      assert.deepEqual(v.issues, []);
    });
  }

  it("merge OCR → snapshot publiable (n° + lien tel)", () => {
    const snap = mergeGardeOcrIntoSnapshot(
      {
        validFrom: "2026-10-31",
        validTo: "2026-11-01",
        label: "",
        doctor: null as { name: string; phone: string; phoneHref: string } | null,
        pharmacy: null as { name: string; phone: string; phoneHref: string } | null,
      },
      fx("sem44-table.txt"),
    );
    assert.equal(snap.doctor?.name, "Dr FOUGEROUSE Pierre-Antoine");
    assert.equal(snap.doctor?.phone, "87 000 800");
    assert.equal(snap.doctor?.phoneHref, "tel:+68987000800");
  });

  for (const printed of ["87 000 800", "87 00 08 00", "87000800", "87.00.08.00", "87-000-800"]) {
    it(`n° « ${printed} » accepté (8 chiffres)`, () => {
      const txt = fx("sem44-table.txt").replace("87 000 800", printed);
      const g = parseOfficialMooreaGarde(txt);
      assert.ok(g);
      assert.equal(phoneDigits(g.phone), "87000800");
      assert.deepEqual(validateOfficialMooreaGarde(g, new Date("2026-10-31T08:00:00-10:00")).issues, []);
    });
  }

  it("deux n° collés sur une ligne ne fusionnent pas", () => {
    const txt = "Dr X Y\nMoorea\t40 56 15 55 87 77 75 37\nSamedi : 12h00 - 18h00";
    const g = parseOfficialMooreaGarde(txt);
    assert.equal(g?.phone, "40 56 15 55");
  });

  it("refuse toujours un n° à 7 ou 9 chiffres", () => {
    const g = parseOfficialMooreaGarde(fx("sem44-table.txt"))!;
    const now = new Date("2026-10-31T08:00:00-10:00");
    assert.match(validateOfficialMooreaGarde({ ...g, phone: "87 000 80" }, now).issues.join(), /invalide/);
    assert.match(validateOfficialMooreaGarde({ ...g, phone: "87 000 8001" }, now).issues.join(), /invalide/);
  });
});

describe("COPPF — sélection de l'image du week-end", () => {
  const base = "https://www.ordre-pharmaciens-polynesie.com/wp-content/uploads";
  const html = [
    `<img src="${base}/2022/07/logo-Texte-coppf.png">`,
    `<img src="${base}/2026/10/2026_GARDES_SEM43.png">`,
    `<img src="${base}/2026/10/Screenshot_20261031_004112_Samsung-Browser-1.jpg">`,
    `<img src="${base}/2026/11/2026_GARDES_SEM45.webp">`,
  ].join("\n");

  it("capture d'écran JPG datée du samedi = week-end 31/10–01/11, prioritaire le vendredi", () => {
    const list = parseCoppfGardeImagesFromHtml(html, new Date("2026-10-30T14:00:00-10:00"));
    assert.match(list[0]!.url, /Screenshot_20261031_004112/);
    assert.deepEqual(
      { from: list[0]!.dates?.validFrom, to: list[0]!.dates?.validTo },
      { from: "2026-10-31", to: "2026-11-01" },
    );
    assert.ok(!list.some((c) => /logo/i.test(c.url)));
  });

  it("PNG / WEBP « SEMnn » restent reconnus", () => {
    const list = parseCoppfGardeImagesFromHtml(html, new Date("2026-11-06T14:00:00-10:00"));
    assert.match(list[0]!.url, /SEM45\.webp$/);
  });
});

describe("Armistice 2026 — férié du mercredi, raté le 10 novembre", () => {
  const tuesdayEvening = new Date("2026-11-10T19:30:00-10:00");
  const ocr = fx("ferie-2026-11-11-ocr.txt");

  it("le week-end suivant n'est pas la période à publier", () => {
    assert.deepEqual(expectedWeekend(tuesdayEvening), {
      validFrom: "2026-11-14",
      validTo: "2026-11-15",
    });
    assert.deepEqual(expectedGardePeriod(tuesdayEvening), {
      validFrom: "2026-11-11",
      validTo: "2026-11-11",
    });
  });

  it("OCR Tesseract : Dr GAUDARD Franck, 40 56 44 63, férié 8h00–16h00", () => {
    const g = parseOfficialMooreaGarde(ocr);
    assert.ok(g, "ligne Moorea trouvée");
    assert.equal(g.doctorName, "Dr GAUDARD Franck");
    assert.equal(g.phone, "40 56 44 63");
    assert.equal(g.week, 46);
    assert.equal(g.validFrom, "2026-11-11");
    assert.equal(g.validTo, "2026-11-11");
    assert.equal(g.sunday, "8h00 – 16h00");
    const v = validateOfficialMooreaGarde(g, tuesdayEvening);
    assert.deepEqual(v.issues, []);
    // L'ancienne fenêtre « week-end seulement » refusait ce tableau.
    const asWeekend = validateOfficialMooreaGarde(g, tuesdayEvening, expectedWeekend(tuesdayEvening));
    assert.equal(asWeekend.ok, false);
  });

  it("le merge ne rebaptise pas le férié en samedi / dimanche", () => {
    const snap = mergeGardeOcrIntoSnapshot(
      {
        validFrom: "2026-11-14",
        validTo: "2026-11-15",
        label: "Week-end",
        doctor: null,
        pharmacy: null,
      },
      ocr,
    );
    assert.equal(snap.validFrom, "2026-11-11");
    assert.equal(snap.validTo, "2026-11-11");
    assert.equal(snap.doctor?.name, "Dr GAUDARD Franck");
    assert.equal(snap.doctor?.phone, "40 56 44 63");
    assert.match(snap.label, /11 novembre/);
    assert.match(snap.label, /Armistice/);
    assert.doesNotMatch(snap.label, /Samedi/);
  });

  it("2026_GARDES_1111.jpg est le tableau du 11, dès le mardi soir", () => {
    const base = "https://www.ordre-pharmaciens-polynesie.com/wp-content/uploads";
    const html = [
      `<img src="${base}/2026/11/2026_GARDES_SEM45.jpg">`,
      `<img src="${base}/2026/11/2026_GARDES_1111.jpg">`,
      `<img src="${base}/2026/11/2026_GARDES_1111-480x556.jpg">`,
    ].join("\n");
    const list = parseCoppfGardeImagesFromHtml(html, tuesdayEvening);
    assert.match(list[0]!.url, /2026_GARDES_1111\.jpg$/);
    assert.equal(list[0]!.dates?.validFrom, "2026-11-11");
    assert.equal(list[0]!.dates?.validTo, "2026-11-11");
    assert.equal(isListedWeekdayHolidayRoster(list[0]!.dates, tuesdayEvening), true);
    assert.equal(isListedWeekdayHolidayRoster(list[0]!.dates, new Date("2026-11-06T12:00:00-10:00")), false);
  });

  it("un mardi sans tableau férié ne fait pas échouer le job", () => {
    assert.equal(
      gardeRunShouldFail({ ok: true, found: false, doctor: null, holidayRoster: false }, 2),
      false,
    );
    assert.equal(
      gardeRunShouldFail({ ok: true, found: false, doctor: null }, 1),
      false,
    );
    assert.equal(
      gardeRunShouldFail({ ok: true, found: false, doctor: null, holidayRoster: false }, 3),
      false,
    );
  });

  it("un férié trouvé mais non publié fait échouer le job, même le mardi", () => {
    assert.equal(
      gardeRunShouldFail(
        { ok: false, found: true, doctor: null, holidayRoster: true },
        2,
      ),
      true,
    );
    assert.equal(
      gardeRunShouldFail(
        { ok: true, found: true, doctor: "Dr GAUDARD Franck", holidayRoster: true },
        2,
      ),
      false,
    );
    assert.equal(
      gardeRunShouldFail({ ok: true, found: false, doctor: null, holidayRoster: false }, 4),
      true,
    );
  });

  it("un mardi ordinaire vise encore le week-end, pas un férié imaginaire", () => {
    const ordinaryTuesday = new Date("2026-10-27T12:00:00-10:00");
    assert.deepEqual(expectedGardePeriod(ordinaryTuesday), expectedWeekend(ordinaryTuesday));
  });
});

describe("erratum SEM46 — capture d'écran du 14 novembre 2026", () => {
  const saturday = new Date("2026-11-14T09:30:00-10:00");
  const noHeader = [
    "TOUR DE GARDE OFFICIEL",
    "ERRATUM",
    "Dr GUAIS Elouan",
    "Moorea\t40 56 44 63",
    "Samedi : 12h00 - 18h00 - Dimanche / férié : 8h00 - 16h00",
    "Dr KELLY Frédérique",
    "Bora-Bora\t87 25 81 18",
    "Samedi : 12h00 - 18h00 - Dimanche / férié : 06h00 - 19h00",
  ].join("\n");

  it("l'en-tête erratum prime sur « Papeete, le 12 novembre 2026 »", () => {
    const g = parseOfficialMooreaGarde(
      [
        "ERRATUM - Semaine n°46 - Samedi 14 novembre 2026 / Dimanche 15 novembre 2026",
        "Dr GUAIS Elouan",
        "Moorea\t40 56 44 63",
        "Samedi : 12h00 - 18h00 - Dimanche / férié : 8h00 - 16h00",
        "Papeete, le 12 novembre 2026",
      ].join("\n"),
    );
    assert.equal(g?.doctorName, "Dr GUAIS Elouan");
    assert.equal(g?.phone, "40 56 44 63");
    assert.equal(g?.validFrom, "2026-11-14");
    assert.equal(g?.validTo, "2026-11-15");
    assert.equal(g?.saturday, "12h00 – 18h00");
    assert.equal(g?.sunday, "8h00 – 16h00");
    assert.deepEqual(validateOfficialMooreaGarde(g, saturday).issues, []);
  });

  it("dates d'en-tête illisibles : on garde celles du fichier image si c'est le week-end attendu", () => {
    const g = parseOfficialMooreaGarde(noHeader);
    assert.equal(g?.validFrom, null);
    assert.equal(g?.saturday, "12h00 – 18h00");
    const snap = mergeGardeOcrIntoSnapshot(
      {
        validFrom: "2026-11-14",
        validTo: "2026-11-15",
        label: "Week-end 2026-11-14 → 2026-11-15",
        doctor: null,
        pharmacy: null,
      },
      noHeader,
    );
    assert.deepEqual(validateGardeBeforePublish(snap, saturday).issues, []);
  });

  it("un tableau sans date n'est pas laissé sur l'ancien week-end", () => {
    const snap = mergeGardeOcrIntoSnapshot(
      {
        validFrom: "2026-10-17",
        validTo: "2026-10-18",
        label: "ancien",
        doctor: null,
        pharmacy: null,
      },
      noHeader,
    );
    assert.deepEqual(validateGardeBeforePublish(snap, saturday).issues, []);
    assert.equal(snap.validFrom, "2026-11-14");
    assert.equal(snap.validTo, "2026-11-15");
  });

  it("Screenshot_20261114 est le week-end 14–15, pas un férié", () => {
    const base = "https://www.ordre-pharmaciens-polynesie.com/wp-content/uploads";
    const html = `<img src="${base}/2026/11/Screenshot_20261114_035834_Samsung-Browser.jpg">`;
    const list = parseCoppfGardeImagesFromHtml(html, saturday);
    assert.match(list[0]!.url, /Screenshot_20261114_035834/);
    assert.deepEqual(
      { from: list[0]!.dates?.validFrom, to: list[0]!.dates?.validTo },
      { from: "2026-11-14", to: "2026-11-15" },
    );
  });
});

describe("capture Samsung du 14/11/2026 — OCR réel et en-tête abîmé", () => {
  const saturday = new Date("2026-11-14T09:30:00-10:00");
  const ocr = fx("erratum-sem46-screenshot-ocr.txt");
  const header = "ERRATUM - Semaine n°46 - Samedi 14 novembre 2026 / Dimanche 15 novembre 2026";

  it("le texte brut contient l'en-tête lisible, et la ligne Moorea suivante est « EN »", () => {
    const lines = ocr.split(/\r?\n/);
    assert.equal(lines[6], header);
    assert.match(lines.join("\n"), /Dr GUAIS Elouan\nMoorea 40 56 44 63\nEN/);
  });

  it("l'ancien motif (slash + deux années) rate un tiret à la place du slash", () => {
    const faulty =
      /samedi\s+(\d{1,2})\s+([a-z]+)\s+(\d{4})\s*\/\s*dimanche\s+(\d{1,2})\s+([a-z]+)\s+(\d{4})/;
    const dashed = "erratum - semaine n°46 - samedi 14 novembre 2026 - dimanche 15 novembre 2026";
    assert.equal(faulty.test(dashed), false);
    assert.deepEqual(
      [parseOfficialWeek(dashed).validFrom, parseOfficialWeek(dashed).validTo],
      ["2026-11-14", "2026-11-15"],
    );
  });

  it("OCR Tesseract de la capture : Dr GUAIS, 40 56 44 63, dates 14–15, semaine 46", () => {
    const g = parseOfficialMooreaGarde(ocr);
    assert.equal(g?.doctorName, "Dr GUAIS Elouan");
    assert.equal(g?.phone, "40 56 44 63");
    assert.equal(g?.week, 46);
    assert.equal(g?.validFrom, "2026-11-14");
    assert.equal(g?.validTo, "2026-11-15");
    assert.equal(g?.saturday, undefined);
    assert.equal(weekendOfIsoWeek(2026, 46)?.validFrom, "2026-11-14");
  });

  it("en-tête retiré : la semaine ISO 46 et le fichier image suffisent, l'article n'est pas bloqué", () => {
    const withoutHeader = ocr.replace(header, "Semaine n°46").replace(
      "Moorea 40 56 44 63\nEN",
      "Moorea\t40 56 44 63\nSamedi : 12h00 - 18h00 - Dimanche / férié : 8h00 - 16h00",
    );
    const g = parseOfficialMooreaGarde(withoutHeader);
    assert.equal(g?.validFrom, "2026-11-14");
    assert.equal(g?.saturday, "12h00 – 18h00");
    assert.equal(g?.sunday, "8h00 – 16h00");
    const snap = mergeGardeOcrIntoSnapshot(
      {
        validFrom: "2026-11-14",
        validTo: "2026-11-15",
        label: "Week-end 2026-11-14 → 2026-11-15",
        doctor: null,
        pharmacy: null,
      },
      withoutHeader,
    );
    assert.deepEqual(validateGardeBeforePublish(snap, saturday).issues, []);
  });

  it("ni en-tête ni numéro de semaine : repli sur la période attendue, sans bloquer", () => {
    const bare = [
      "Dr GUAIS Elouan",
      "Moorea\t40 56 44 63",
      "Samedi : 12h00 - 18h00 - Dimanche / férié : 8h00 - 16h00",
    ].join("\n");
    const g = parseOfficialMooreaGarde(bare);
    assert.equal(g?.validFrom, null);
    const snap = mergeGardeOcrIntoSnapshot(
      {
        validFrom: "2026-10-17",
        validTo: "2026-10-18",
        label: "ancien",
        doctor: null,
        pharmacy: null,
      },
      bare,
    );
    const settled = ensureGardeDates(snap, saturday);
    assert.match(settled.warning ?? "", /période attendue/);
    assert.equal(settled.snap.validFrom, "2026-11-14");
    assert.equal(settled.snap.officialCheck?.validFrom, "2026-11-14");
    assert.deepEqual(validateGardeBeforePublish(settled.snap, saturday).issues, []);
  });

  it("« nov. » et une seule année restent le 14–15", () => {
    const g = parseOfficialWeek(
      "ERRATUM semaine n°46 samedi 14 nov. / dimanche 15 nov. 2026",
    );
    assert.deepEqual([g.validFrom, g.validTo, g.week], ["2026-11-14", "2026-11-15", 46]);
  });
});

describe("dates — week-end à cheval sur deux mois", () => {
  it("« Samedi 31 octobre / Dimanche 01 novembre » ⇒ 2026-10-31 → 2026-11-01", () => {
    const d = parseWeekendDatesFromText("Semaine n°44 - Samedi 31 octobre 2026 / Dimanche 01 novembre 2026 férié");
    assert.deepEqual([d?.validFrom, d?.validTo], ["2026-10-31", "2026-11-01"]);
  });
});

const COPPF = "https://www.ordre-pharmaciens-polynesie.com/wp-content/uploads";
const MATARII_MORNING = new Date("2026-11-20T07:14:00-10:00");
const WEEKEND_OPEN = new Date("2026-11-21T08:00:00-10:00");

function gardeSnap(
  validFrom: string,
  validTo: string,
  doctorName: string | null,
): GardeMooreaSnapshot {
  return {
    validFrom,
    validTo,
    label: validFrom,
    doctor: doctorName
      ? { name: doctorName, phone: "40 56 00 00", phoneHref: "tel:+68940560000" }
      : null,
    pharmacy: null,
    sourceUrl: "https://www.ordre-pharmaciens-polynesie.com/medecins-de-garde/",
    syncedAt: "2026-11-20T17:00:00.000Z",
  };
}

describe("Matari'i 20 novembre 2026 — férié et week-end en ligne ensemble", () => {
  const holidayHtml = [
    `<img src="${COPPF}/2026/11/2026_GARDES_SEM47.jpg">`,
    `<img src="${COPPF}/2026/11/2026_GARDES_2011-1.jpg">`,
    `<img src="${COPPF}/2026/11/2026_GARDES_2011-1-480x555.jpg">`,
    `<img src="${COPPF}/2026/11/2026_GARDES_SEM47-480x568.jpg">`,
  ].join("\n");

  it("2026_GARDES_2011-1.jpg est le 20 novembre, suffixe -1 compris", () => {
    const holiday = holidayDatesFromFilename("2026_GARDES_2011-1.jpg", 2026, 11);
    assert.equal(holiday?.validFrom, "2026-11-20");
    assert.equal(holiday?.validTo, "2026-11-20");
    assert.match(holiday?.label ?? "", /Matari/);
    const thumb = holidayDatesFromFilename("2026_GARDES_2011-1-480x555.jpg", 2026, 11);
    assert.equal(thumb?.validFrom, "2026-11-20");
    const july = holidayDatesFromFilename("2026_GARDES_1402maj.jpg", 2026, 7);
    assert.equal(july?.validFrom, "2026-07-14");
  });

  it("le vendredi matin, l'affiche férié passe devant SEM47", () => {
    const list = parseCoppfGardeImagesFromHtml(holidayHtml, MATARII_MORNING);
    assert.match(list[0]!.url, /2026_GARDES_2011-1\.jpg$/);
    assert.equal(list[0]!.dates?.validFrom, "2026-11-20");
    assert.equal(isListedWeekdayHolidayRoster(list[0]!.dates, MATARII_MORNING), true);
    assert.deepEqual(expectedGardePeriod(MATARII_MORNING), {
      validFrom: "2026-11-20",
      validTo: "2026-11-20",
    });
  });

  it("le samedi, SEM47 redevient l'affiche à publier", () => {
    const list = parseCoppfGardeImagesFromHtml(holidayHtml, WEEKEND_OPEN);
    assert.match(list[0]!.url, /2026_GARDES_SEM47\.jpg$/);
    assert.equal(list[0]!.dates?.validFrom, "2026-11-21");
    assert.equal(list[0]!.dates?.validTo, "2026-11-22");
    assert.deepEqual(expectedGardePeriod(WEEKEND_OPEN), {
      validFrom: "2026-11-21",
      validTo: "2026-11-22",
    });
    const best = pickBestGardeSnapshot(
      [
        gardeSnap("2026-11-20", "2026-11-20", "Dr GOEURIOT Julien"),
        gardeSnap("2026-11-21", "2026-11-22", "Dr APPIETTO Audrey"),
      ],
      WEEKEND_OPEN,
    );
    assert.equal(best?.validFrom, "2026-11-21");
    assert.equal(best?.doctor?.name, "Dr APPIETTO Audrey");
  });

  it("le vendredi, le férié gagne aussi au choix du snapshot", () => {
    const best = pickBestGardeSnapshot(
      [
        gardeSnap("2026-11-21", "2026-11-22", "Dr APPIETTO Audrey"),
        gardeSnap("2026-11-20", "2026-11-20", "Dr GOEURIOT Julien"),
      ],
      MATARII_MORNING,
    );
    assert.equal(best?.validFrom, "2026-11-20");
    assert.equal(gardeArticleSlug(best!.validFrom), "garde-moorea-2026-11-20");
    assert.equal(gardeArticleSlug("2026-11-21"), "garde-moorea-2026-11-21");
  });

  it("OCR Tesseract du 20 : GOEURIOT, 40 56 26 19, 8h00–16h00, date prise sur le fichier", () => {
    const ocr = fx("ferie-2026-11-20-ocr.txt");
    const read = parseOfficialMooreaGarde(ocr);
    assert.equal(read?.doctorName, "Dr GOEURIOT Julien");
    assert.equal(read?.phone, "40 56 26 19");
    assert.equal(read?.sunday, "8h00 – 16h00");
    assert.equal(read?.validFrom, null);

    const holiday = mergeGardeOcrIntoSnapshot(
      {
        validFrom: "2026-11-20",
        validTo: "2026-11-20",
        label: "férié",
        doctor: null,
        pharmacy: null,
      },
      ocr,
    ) as GardeMooreaSnapshot;
    const weekend = mergeGardeOcrIntoSnapshot(
      {
        validFrom: "2026-11-21",
        validTo: "2026-11-22",
        label: "week-end",
        doctor: null,
        pharmacy: null,
      },
      [
        "Semaine n°47 - Samedi 21 novembre 2026 / Dimanche 22 novembre 2026",
        "Dr APPIETTO Audrey",
        "Moorea\t40 56 27 07",
        "Samedi : 12h00 - 18h00 - Dimanche / férié : 8h00 - 16h00",
      ].join("\n"),
    ) as GardeMooreaSnapshot;
    assert.equal(weekend.doctor?.name, "Dr APPIETTO Audrey");
    assert.equal(weekend.validFrom, "2026-11-21");

    const picked = pickOfficialOcrCandidate(
      [
        { fileDates: { validFrom: "2026-11-21", validTo: "2026-11-22" }, snap: weekend },
        { fileDates: { validFrom: "2026-11-20", validTo: "2026-11-20" }, snap: holiday },
      ],
      { validFrom: "2026-11-20", validTo: "2026-11-20" },
    );
    assert.equal(picked?.doctor?.name, "Dr GOEURIOT Julien");
    assert.equal(picked?.doctor?.phone, "40 56 26 19");
    const issues = validateGardeBeforePublish(picked!, MATARII_MORNING).issues;
    assert.deepEqual(issues, []);
    assert.equal(picked!.validFrom, "2026-11-20");
    assert.equal(picked!.validTo, "2026-11-20");
    assert.match(picked!.label, /20 novembre/);
    assert.match(picked!.label, /Matari/);
  });

  it("l'affiche week-end illisible n'est pas collée sur le férié", () => {
    const weekendUndated = mergeGardeOcrIntoSnapshot(
      {
        validFrom: "2026-11-21",
        validTo: "2026-11-22",
        label: "week-end",
        doctor: null,
        pharmacy: null,
      },
      ["Dr APPIETTO Audrey", "Moorea\t40 56 27 07", "Samedi : 12h00 - 18h00"].join("\n"),
    ) as GardeMooreaSnapshot;
    assert.equal(weekendUndated.officialCheck?.validFrom ?? null, null);
    const picked = pickOfficialOcrCandidate(
      [{ fileDates: { validFrom: "2026-11-21", validTo: "2026-11-22" }, snap: weekendUndated }],
      { validFrom: "2026-11-20", validTo: "2026-11-20" },
    );
    assert.equal(picked, null);
  });

  it("un contrôle de publication refuse un autre médecin ou un autre jour", () => {
    assert.equal(
      gardePublishMismatch(
        {
          validFrom: "2026-11-20",
          validTo: "2026-11-20",
          doctor: { name: "Dr GOEURIOT Julien", phone: "40 56 26 19" },
        },
        { doctor: "Dr GOEURIOT Julien", phone: "40562619", validFrom: "2026-11-20" },
      ),
      null,
    );
    assert.match(
      gardePublishMismatch(
        {
          validFrom: "2026-11-21",
          validTo: "2026-11-22",
          doctor: { name: "Dr APPIETTO Audrey", phone: "40 56 27 07" },
        },
        { doctor: "Dr GOEURIOT Julien", phone: "40562619", validFrom: "2026-11-20" },
      ) ?? "",
      /validFrom|médecin|téléphone/,
    );
    assert.equal(
      gardePublishMismatch(
        {
          validFrom: "2026-11-21",
          validTo: "2026-11-22",
          doctor: { name: "Dr APPIETTO Audrey", phone: "40 56 27 07" },
          doctorHours: { saturday: "12h00 - 18h00", sunday: "8h00 – 16h00" },
        },
        {
          doctor: "Dr APPIETTO Audrey",
          phone: "40 56 27 07",
          validFrom: "2026-11-21",
          validTo: "2026-11-22",
          saturday: "12h00 – 18h00",
          sunday: "8h00-16h00",
        },
      ),
      null,
    );
    assert.match(
      gardePublishMismatch(
        {
          validFrom: "2026-11-21",
          validTo: "2026-11-22",
          doctor: { name: "Dr APPIETTO Audrey", phone: "40 56 27 07" },
          doctorHours: { saturday: "12h00 – 18h00", sunday: "9h00 – 16h00" },
        },
        { sunday: "8h00 – 16h00" },
      ) ?? "",
      /dimanche/,
    );
  });
});

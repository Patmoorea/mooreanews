import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isWeekdayPublicHolidayIso,
  tahitiHolidayLabel,
  upcomingWeekdayHoliday,
} from "./tahiti-holidays";

/** Calendrier 2026 de service-public.pf et arrêté HC 613 du 7 novembre 2025. */
const HOLIDAYS_2026: { iso: string; label: string }[] = [
  { iso: "2026-01-01", label: "Jour de l'an" },
  { iso: "2026-03-05", label: "Arrivée de l'Évangile" },
  { iso: "2026-04-03", label: "Vendredi saint" },
  { iso: "2026-04-06", label: "Lundi de Pâques" },
  { iso: "2026-05-01", label: "Fête du travail" },
  { iso: "2026-05-08", label: "Victoire 1945" },
  { iso: "2026-05-14", label: "Ascension" },
  { iso: "2026-05-25", label: "Lundi de Pentecôte" },
  { iso: "2026-07-14", label: "Fête nationale" },
  { iso: "2026-08-15", label: "Assomption" },
  { iso: "2026-11-01", label: "Toussaint" },
  { iso: "2026-11-11", label: "Armistice" },
  { iso: "2026-11-20", label: "Matari'i" },
  { iso: "2026-12-25", label: "Noël" },
];

describe("fériés Polynésie 2026", () => {
  for (const holiday of HOLIDAYS_2026) {
    it(`${holiday.iso} = ${holiday.label}`, () => {
      const atNoon = new Date(`${holiday.iso}T12:00:00-10:00`);
      assert.equal(tahitiHolidayLabel(atNoon), holiday.label);
    });
  }

  it("le 29 juin, le 29 avril et le dimanche de Pâques ne sont plus fériés", () => {
    assert.equal(tahitiHolidayLabel(new Date("2026-06-29T12:00:00-10:00")), null);
    assert.equal(tahitiHolidayLabel(new Date("2026-04-29T12:00:00-10:00")), null);
    assert.equal(tahitiHolidayLabel(new Date("2026-04-05T12:00:00-10:00")), null);
    assert.equal(isWeekdayPublicHolidayIso("2026-06-29"), false);
  });

  it("Matari'i 2026 est un vendredi férié, l'Assomption un samedi", () => {
    assert.equal(isWeekdayPublicHolidayIso("2026-11-20"), true);
    assert.equal(isWeekdayPublicHolidayIso("2026-08-15"), false);
    assert.equal(isWeekdayPublicHolidayIso("2026-11-01"), false);
  });

  it("le vendredi 20 novembre, le férié à publier est aujourd'hui", () => {
    assert.deepEqual(upcomingWeekdayHoliday(new Date("2026-11-20T07:14:00-10:00")), {
      validFrom: "2026-11-20",
      validTo: "2026-11-20",
    });
  });

  it("le samedi 21, Matari'i n'est plus la période à venir", () => {
    assert.equal(upcomingWeekdayHoliday(new Date("2026-11-21T08:00:00-10:00")), null);
  });
});

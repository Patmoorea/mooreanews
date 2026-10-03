import { activeSeason, easterSunday } from "../src/lib/seasonal-theme";

function at(iso: string) {
  return activeSeason(new Date(iso))?.id ?? null;
}

const easter: Record<number, string> = {
  2024: "3-31",
  2025: "4-20",
  2026: "4-5",
  2027: "3-28",
  2028: "4-16",
  2029: "4-1",
  2030: "4-21",
};

for (const [year, expected] of Object.entries(easter)) {
  const sunday = easterSunday(Number(year));
  const got = `${sunday.month}-${sunday.day}`;
  if (got !== expected) {
    throw new Error(`Pâques ${year}: ${got}, attendu ${expected}`);
  }
}

const cases: Array<[string, string | null]> = [
  ["2026-12-31T21:00:00Z", null],
  ["2026-12-31T22:00:00Z", "nouvel-an"],
  ["2027-01-01T10:00:00Z", "nouvel-an"],
  ["2027-01-02T20:00:00Z", "nouvel-an"],
  ["2027-01-03T10:00:00Z", null],
  ["2026-02-12T20:00:00Z", null],
  ["2026-02-13T20:00:00Z", "saint-valentin"],
  ["2026-02-15T20:00:00Z", "saint-valentin"],
  ["2026-02-16T20:00:00Z", null],
  ["2026-04-02T20:00:00Z", null],
  ["2026-04-03T20:00:00Z", "paques"],
  ["2026-04-06T20:00:00Z", "paques"],
  ["2026-04-07T20:00:00Z", null],
  ["2027-03-26T20:00:00Z", "paques"],
  ["2027-03-29T20:00:00Z", "paques"],
  ["2027-03-30T20:00:00Z", null],
  ["2026-06-10T20:00:00Z", null],
  ["2026-06-11T20:00:00Z", "coupe-du-monde"],
  ["2026-06-30T20:00:00Z", "coupe-du-monde"],
  ["2026-07-01T20:00:00Z", "heiva"],
  ["2026-07-19T20:00:00Z", "heiva"],
  ["2027-06-15T20:00:00Z", null],
  ["2027-07-15T20:00:00Z", "heiva"],
  ["2026-08-09T20:00:00Z", "baleines"],
  ["2026-08-10T20:00:00Z", "rentree"],
  ["2026-08-25T20:00:00Z", "rentree"],
  ["2026-08-26T20:00:00Z", "baleines"],
  ["2026-09-30T20:00:00Z", "baleines"],
  ["2026-10-03T20:00:00Z", "octobre-rose"],
  ["2026-10-24T20:00:00Z", "octobre-rose"],
  ["2026-10-25T20:00:00Z", "hawaiki-nui"],
  ["2026-10-31T20:00:00Z", "hawaiki-nui"],
  ["2026-11-05T20:00:00Z", "hawaiki-nui"],
  ["2026-11-06T20:00:00Z", null],
  ["2026-12-14T20:00:00Z", null],
  ["2026-12-15T20:00:00Z", "noel"],
  ["2026-12-26T20:00:00Z", "noel"],
  ["2026-12-27T20:00:00Z", null],
];

for (const [iso, expected] of cases) {
  const got = at(iso);
  if (got !== expected) {
    throw new Error(`${iso}: ${got}, attendu ${expected}`);
  }
}

console.log("saisons ok");

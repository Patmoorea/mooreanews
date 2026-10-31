import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyGardeFailure, gardeFailureText, shouldAlertGardeNow } from "./garde-alerts";
import { sniffImageType } from "./garde-ocr-space";

describe("alertes garde — cause réelle", () => {
  it("affiche du week-end absente ⇒ « pas encore publiée » (et pas « OCR trop lent »)", () => {
    const c = classifyGardeFailure({ posterForWeekend: false, officialRead: true, officialForWeekend: false });
    assert.equal(c, "affiche_non_publiee");
    assert.doesNotMatch(gardeFailureText(c), /OCR/);
  });
  it("affiche présente mais ligne Moorea illisible ⇒ ocr", () => {
    assert.equal(classifyGardeFailure({ posterForWeekend: true, officialRead: false, officialForWeekend: false }), "ocr");
  });
  it("ligne Moorea du week-end lue mais refusée ⇒ validation", () => {
    assert.equal(classifyGardeFailure({ posterForWeekend: true, officialRead: true, officialForWeekend: true }), "validation");
  });
  it("pas d'alerte lun–mer, ni « pas encore publiée » avant vendredi midi", () => {
    assert.equal(shouldAlertGardeNow("ocr", new Date("2026-10-27T09:00:00-10:00")), false); // mardi
    assert.equal(shouldAlertGardeNow("affiche_non_publiee", new Date("2026-10-29T17:00:00-10:00")), false); // jeudi
    assert.equal(shouldAlertGardeNow("affiche_non_publiee", new Date("2026-10-30T10:00:00-10:00")), false); // ven 10h
    assert.equal(shouldAlertGardeNow("affiche_non_publiee", new Date("2026-10-30T14:00:00-10:00")), true); // ven 14h
    assert.equal(shouldAlertGardeNow("ocr", new Date("2026-10-29T17:00:00-10:00")), true);
  });
});

describe("OCR.space — type d'image réel", () => {
  it("PNG / JPG / WEBP", () => {
    assert.equal(sniffImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).mime, "image/png");
    assert.equal(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])).mime, "image/jpeg");
    assert.equal(sniffImageType(Buffer.from("RIFF0000WEBPVP8 ", "ascii")).mime, "image/webp");
  });
});

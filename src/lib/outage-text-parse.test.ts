import assert from "node:assert/strict";
import { test } from "node:test";
import { outageSyncFingerprint } from "@/lib/utility-outages-shared";
import { isTeItoRauOutageMessage, outageFromText } from "@/lib/outage-text-parse";

// Extraits des publications Te Ito Rau du 27/10/2026 et 22/10/2026.
const PAPETOAI = `📢[INFO COUPURE D’ÉLECTRICITÉ – PAPETOAI 28.10.2026]

Bonjour,

TE ITO RAU vous informe qu'une coupure d’électricité est programmée pour travaux de remise en conformité de coffret le mercredi 28 octobre 2026 de 08h00 à 13h00.

Site : PAPETOAI - Urufara extension KELLEY (PK 19,490)

L’équipe TE ITO RAU NO MOOREA-MAIAO`;

const TEMAE = `📢 INFO COUPURE D’ÉLECTRICITÉ – TEMAE | 23.10.2026

Bonjour à tous,

Vous informe qu'une coupure d’électricité est programmée pour travaux de poste le vendredi 23 octobre 2026 de 08h00 à 11h00.

Site : Motu TEMAE.

L’équipe TE ITO RAU NO MOOREA-MAIAO`;

function parse(id: string, text: string) {
  return outageFromText({
    id,
    title: text.split("\n")[0],
    corpus: text,
    sourceUrl: "https://www.facebook.com/profile.php?id=100088637945937",
    sourceLabel: "Te Ito Rau — Facebook",
  });
}

test("Te Ito Rau PAPETOAI 28.10 → coupure EDT 08h00–13h00", () => {
  assert.equal(isTeItoRauOutageMessage(PAPETOAI), true);
  const o = parse("p", PAPETOAI);
  assert.ok(o);
  assert.equal(o.kind, "coupure_edt");
  assert.equal(o.startsAt, "2026-10-28T18:00:00.000Z");
  assert.equal(o.endsAt, "2026-10-28T23:00:00.000Z");
  assert.equal(outageSyncFingerprint(o), "coupure_edt-2026-10-28-papetoai");
});

test("Te Ito Rau TEMAE 23.10 → coupure EDT 08h00–11h00", () => {
  assert.equal(isTeItoRauOutageMessage(TEMAE), true);
  const o = parse("t", TEMAE);
  assert.ok(o);
  assert.equal(o.kind, "coupure_edt");
  assert.equal(o.startsAt, "2026-10-23T18:00:00.000Z");
  assert.equal(o.endsAt, "2026-10-23T21:00:00.000Z");
  assert.equal(outageSyncFingerprint(o), "coupure_edt-2026-10-23-temae");
});

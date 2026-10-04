import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { laadKennisbank, leesPagina } from "../src/kennisbank.ts";

const voorbeeld = `# Minimumloon

Geldig voor: 2025 en 2026. Stand van zaken: 4 oktober 2026. Bijgewerkt: 2026-10-04.

## Kern

- Eerste punt (bron: [A](https://a.nl/), art. 1).
  vervolg van het eerste punt
- Tweede punt.

## Details

Uurloon per leeftijd (bron: [B](https://b.nl/)):

| Leeftijd | Loon |
|---|---|
| 21 | 14,99 |

### Jeugd

Losse alinea.

## Historie

Vroeger was het anders.

## Open vragen

- Wat geldt in 2027?

## Bronnen

- [A](https://a.nl/) — kop
`;

test("leest titel, geldigheid en datum uit de kop", () => {
  const p = leesPagina("minimumloon.md", voorbeeld, "WML per datum");
  expect(p.naam).toBe("minimumloon");
  expect(p.titel).toBe("Minimumloon");
  expect(p.geldigVoor).toBe("2025 en 2026. Stand van zaken: 4 oktober 2026.");
  expect(p.bijgewerkt).toBe("2026-10-04");
  expect(p.dekt).toBe("WML per datum");
  expect(p.markdown).toBe(voorbeeld);
});

test("elk opsommingspunt is een eigen stuk, met vervolgregels erbij", () => {
  const p = leesPagina("minimumloon.md", voorbeeld);
  const kern = p.passages.filter((s) => s.kop === "Kern");
  expect(kern.map((s) => s.tekst)).toEqual([
    "- Eerste punt (bron: [A](https://a.nl/), art. 1).\n  vervolg van het eerste punt",
    "- Tweede punt.",
  ]);
});

test("een tabel hoort bij de alinea die haar inleidt", () => {
  const p = leesPagina("minimumloon.md", voorbeeld);
  const details = p.passages.filter((s) => s.kop === "Details");
  expect(details).toHaveLength(1);
  expect(details[0].tekst).toContain("Uurloon per leeftijd");
  expect(details[0].tekst).toContain("| 21 | 14,99 |");
});

test("een tussenkop komt in de kop van het stuk", () => {
  const p = leesPagina("minimumloon.md", voorbeeld);
  expect(p.passages.find((s) => s.tekst === "Losse alinea.")?.kop).toBe(
    "Details · Jeugd",
  );
});

test("het etiket volgt de kop en de bronnenlijst telt niet mee", () => {
  const p = leesPagina("minimumloon.md", voorbeeld);
  const etiket = (tekst: string) =>
    p.passages.find((s) => s.tekst.includes(tekst))?.status;
  expect(etiket("Eerste punt")).toBe("geldt nu");
  expect(etiket("Losse alinea")).toBe("geldt nu");
  expect(etiket("Vroeger")).toBe("historie");
  expect(etiket("2027")).toBe("open vraag");
  expect(p.passages.some((s) => s.kop === "Bronnen")).toBe(false);
  expect(
    p.passages.every(
      (s) => s.pagina === "minimumloon" && s.titel === "Minimumloon",
    ),
  ).toBe(true);
});

test("een pagina zonder de vaste opbouw laadt met lege velden", () => {
  const p = leesPagina("los.md", "zomaar wat tekst\n\nnog een regel");
  expect(p).toMatchObject({
    naam: "los",
    titel: "los",
    geldigVoor: "",
    bijgewerkt: "",
    passages: [],
  });
});

test("de echte kennisbank laadt: 18 pagina's, elk met een beschrijving en stukken", () => {
  const paginas = laadKennisbank(join(import.meta.dirname, "..", "kennis"));
  expect(paginas).toHaveLength(18);
  for (const p of paginas) {
    expect(p.dekt, p.naam).not.toBe("");
    expect(p.bijgewerkt, p.naam).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.passages.length, p.naam).toBeGreaterThan(5);
  }
  expect(paginas.map((p) => p.naam)).toContain("wtta-normenkader");
});

test("een lege of ontbrekende map geeft een melding die de map noemt", () => {
  const leeg = mkdtempSync(join(tmpdir(), "kennis-"));
  expect(() => laadKennisbank(leeg)).toThrow(
    `Geen kennispagina's gevonden in ${leeg}`,
  );
  expect(() => laadKennisbank(join(leeg, "bestaat-niet"))).toThrow(
    "Geen kennispagina's gevonden in",
  );
});

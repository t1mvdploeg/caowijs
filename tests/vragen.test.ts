import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { laadKennisbank } from "../src/kennisbank.ts";

interface Vraag {
  vraag: string;
  pagina: string;
  ook?: string[];
}

const wortel = join(import.meta.dirname, "..");
const vragen: Vraag[] = JSON.parse(
  readFileSync(join(wortel, "evals", "vragen.json"), "utf8"),
);
const namen = laadKennisbank(join(wortel, "kennis")).map((p) => p.naam);

test("minstens 36 vragen, elke vraag een zin", () => {
  expect(vragen.length).toBeGreaterThanOrEqual(36);
  for (const v of vragen) expect(v.vraag.length, v.vraag).toBeGreaterThan(15);
  expect(new Set(vragen.map((v) => v.vraag)).size).toBe(vragen.length);
});

test("elke vraag wijst naar bestaande pagina's", () => {
  for (const v of vragen)
    for (const naam of [v.pagina, ...(v.ook ?? [])])
      expect(namen, v.vraag).toContain(naam);
});

test("elke pagina heeft minstens twee vragen", () => {
  for (const naam of namen)
    expect(
      vragen.filter((v) => v.pagina === naam).length,
      naam,
    ).toBeGreaterThanOrEqual(2);
});

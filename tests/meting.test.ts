import { join } from "node:path";
import { expect, test } from "vitest";
import { laadVragen, meet } from "../evals/meet.ts";
import { laadKennisbank } from "../src/kennisbank.ts";

test("de juiste pagina staat bij minstens 90% van de testvragen in de bovenste drie", () => {
  const m = meet(
    laadKennisbank(join(import.meta.dirname, "..", "kennis")),
    laadVragen(),
  );
  expect(m.inTopDrie / m.aantal, m.gemist.join("\n")).toBeGreaterThanOrEqual(
    0.9,
  );
});

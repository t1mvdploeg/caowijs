import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { NIET_OPENBAAR, verboden } from "../scripts/publiceer-kennis.ts";

const map = join(import.meta.dirname, "..", "kennis");
const bestanden = readdirSync(map);

test("er staan 18 pagina's en een overzicht", () => {
  expect(bestanden.filter((naam) => naam.endsWith(".md"))).toHaveLength(19);
});

test("de pagina's die niet naar buiten mogen ontbreken", () => {
  for (const naam of NIET_OPENBAAR) expect(bestanden).not.toContain(naam);
});

test.each(bestanden)("%s bevat niets dat niet naar buiten mag", (naam) => {
  expect(verboden(readFileSync(join(map, naam), "utf8"))).toEqual([]);
});

test.each(bestanden.filter((naam) => naam !== "README.md"))(
  "%s: elke regel met een bron bevat een link",
  (naam) => {
    const zonderLink = readFileSync(join(map, naam), "utf8")
      .split("\n")
      .filter((regel) => regel.includes("(bron:") && !regel.includes("](http"));
    expect(zonderLink).toEqual([]);
  },
);

import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { leesBron, verboden, zetOm } from "../scripts/publiceer-kennis.ts";

const bron = (pad: string) =>
  pad === "abu.nl/a.md"
    ? { titel: "Pagina A", url: "https://www.abu.nl/a/" }
    : pad === "wet/b.md"
      ? { titel: "Wet [B]", url: "https://wetten.overheid.nl/x(1)" }
      : undefined;

test("zet een verwijzing om naar een link en laat de plek staan", () => {
  const { tekst, onbekend } = zetOm(
    "Het is 8% (bron: docs/info/abu.nl/a.md, art. 15).",
    bron,
  );
  expect(tekst).toBe(
    "Het is 8% (bron: [Pagina A](https://www.abu.nl/a/), art. 15).",
  );
  expect(onbekend).toEqual([]);
});

test("zet meerdere verwijzingen in één haakje om, ook tussen backticks", () => {
  const { tekst } = zetOm(
    "(bron: docs/info/abu.nl/a.md; docs/info/wet/b.md, lid 2)\n- `docs/info/abu.nl/a.md` — kop",
    bron,
  );
  expect(tekst).toBe(
    "(bron: [Pagina A](https://www.abu.nl/a/); [Wet B](https://wetten.overheid.nl/x%281%29), lid 2)\n- [Pagina A](https://www.abu.nl/a/) — kop",
  );
});

test("meldt een verwijzing zonder webadres en laat haar staan", () => {
  const { tekst, onbekend } = zetOm("(bron: docs/info/weg/c.md)", bron);
  expect(onbekend).toEqual(["weg/c.md"]);
  expect(tekst).toContain("docs/info/weg/c.md");
});

test("maakt van docs/kennis een gewone paginanaam", () => {
  expect(
    zetOm("zie `docs/kennis/wtta.md` en docs/kennis/paww.md", bron).tekst,
  ).toBe("zie `wtta.md` en `paww.md`");
});

test("verboden vindt wat niet naar buiten mag, maar geen link naar een webpagina", () => {
  expect(verboden("zie `kostprijselementen.md`")).toHaveLength(1);
  expect(
    verboden("uit data/parameters/2026.json van de tarieftool"),
  ).toHaveLength(2);
  expect(
    verboden(
      "[Kostprijselementen](https://www.abu.nl/ledenservice/kostprijselementen/)",
    ),
  ).toEqual([]);
});

test("leesBron haalt titel en webadres uit de kop van een archiefbestand", () => {
  const map = mkdtempSync(join(tmpdir(), "info-"));
  mkdirSync(join(map, "sncu.nl"));
  writeFileSync(
    join(map, "sncu.nl", "x.md"),
    "# Wat zijn wachtdagen?\n\nBron: https://www.sncu.nl/x/  \nOpgehaald: 2026-10-04\n\ntekst",
  );
  writeFileSync(join(map, "sncu.nl", "kaal.md"), "# Zonder bron\n\ntekst");
  expect(leesBron(map, "sncu.nl/x.md")).toEqual({
    titel: "Wat zijn wachtdagen?",
    url: "https://www.sncu.nl/x/",
  });
  expect(leesBron(map, "sncu.nl/kaal.md")).toBeUndefined();
  expect(leesBron(map, "sncu.nl/bestaat-niet.md")).toBeUndefined();
  expect(leesBron(map, "abu.nl/documenten/SFU-cao-2026.md")?.url).toBe(
    "https://www.abu.nl/app/uploads/2026/08/SFU-cao-2026.pdf",
  );
});

test("verboden past op de map docs/info, niet op een webadres met docs/infographic", () => {
  expect(
    verboden(
      "https://download.belastingdienst.nl/belastingdienst/docs/infographic-x.pdf",
    ),
  ).toEqual([]);
  expect(verboden("docs/info/x.md")).toHaveLength(1);
  expect(verboden("in docs/info")).toHaveLength(1);
  expect(verboden("docs/info-x")).toHaveLength(1);
});

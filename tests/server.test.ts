import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeAll, expect, test } from "vitest";
import { leesPagina } from "../src/kennisbank.ts";
import { maakServer } from "../src/server.ts";

const paginas = [
  leesPagina(
    "minimumloon.md",
    "# Minimumloon\n\nGeldig voor: 2026. Bijgewerkt: 2026-10-04.\n\n## Kern\n\n- Het minimumloon is € 14,99 per uur (bron: [Rijksoverheid](https://www.rijksoverheid.nl/x), tabel).\n\n## Historie\n\n- In 2025 was het minimumloon € 14,40.\n\n## Open vragen\n\n- Het minimumloon voor 2027 is nog niet bekend.\n",
    "WML per datum",
  ),
  leesPagina(
    "paww.md",
    "# PAWW\n\nGeldig voor: 2026. Bijgewerkt: 2026-10-04.\n\n## Kern\n\n- De bijdrage is 0,1%.\n",
    "PAWW-bijdrage",
  ),
];

let client: Client;
const roep = async (naam: string, invoer: Record<string, unknown> = {}) => {
  const uit = (await client.callTool({ name: naam, arguments: invoer })) as {
    content: { type: string; text: string }[];
    isError?: boolean;
  };
  return { tekst: uit.content[0].text, fout: uit.isError === true };
};

beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([maakServer(paginas).connect(a), client.connect(b)]);
});

test("biedt drie tools aan, alle drie alleen-lezen, en geeft instructies mee", async () => {
  const { tools } = await client.listTools();
  expect(tools.map((t) => t.name).sort()).toEqual([
    "lees_onderwerp",
    "onderwerpen",
    "zoek",
  ]);
  for (const tool of tools) expect(tool.annotations?.readOnlyHint).toBe(true);
  expect(client.getInstructions()).toContain("bron");
  expect(client.getInstructions()).toContain("geen juridisch advies");
});

test("onderwerpen noemt elke pagina met beschrijving en datum", async () => {
  const { tekst } = await roep("onderwerpen");
  expect(tekst).toContain("minimumloon");
  expect(tekst).toContain("WML per datum");
  expect(tekst).toContain("2026-10-04");
  expect(tekst).toContain("paww");
});

test("zoek geeft het stuk met etiket, pagina, datum en bronlink", async () => {
  const { tekst, fout } = await roep("zoek", {
    vraag: "hoe hoog is het minimumloon",
  });
  expect(fout).toBe(false);
  expect(tekst).toContain("€ 14,99");
  expect(tekst).toContain("geldt nu");
  expect(tekst).toContain("Pagina: minimumloon");
  expect(tekst).toContain("2026-10-04");
  expect(tekst).toContain("[Rijksoverheid](https://www.rijksoverheid.nl/x)");
  expect(tekst).toContain("geen juridisch advies");
});

test("zoek zet historie en open vragen onder hun eigen etiket", async () => {
  const { tekst } = await roep("zoek", {
    vraag: "minimumloon 2025 2027",
    aantal: 10,
  });
  expect(tekst).toMatch(/historie[\s\S]*14,40/);
  expect(tekst).toMatch(/open vraag[\s\S]*2027/);
});

test("zoek meldt een stuk zonder bronlink", async () => {
  const { tekst } = await roep("zoek", {
    vraag: "bijdrage",
    onderwerp: "paww",
  });
  expect(tekst).toContain("0,1%");
  expect(tekst).toContain("Geen bronlink bij dit stuk");
});

test("zoek zonder resultaat zegt dat en verwijst naar onderwerpen", async () => {
  for (const vraag of ["kwantumfysica", "wat is het?"]) {
    const { tekst, fout } = await roep("zoek", { vraag });
    expect(fout).toBe(false);
    expect(tekst).toContain("Niets gevonden");
    expect(tekst).toContain("onderwerpen");
  }
});

test("zoek beperkt tot een onderwerp, ook met .md erachter", async () => {
  const { tekst } = await roep("zoek", {
    vraag: "minimumloon bijdrage",
    onderwerp: "paww.md",
  });
  expect(tekst).toContain("Pagina: paww");
  expect(tekst).not.toContain("Pagina: minimumloon");
});

test("een onbekend onderwerp geeft een fout met de geldige namen", async () => {
  for (const [naam, invoer] of [
    ["zoek", { vraag: "loon", onderwerp: "bestaat-niet" }],
    ["lees_onderwerp", { pagina: "../../etc/passwd" }],
  ] as const) {
    const { tekst, fout } = await roep(naam, invoer);
    expect(fout).toBe(true);
    expect(tekst).toContain("minimumloon, paww");
  }
});

test("een te lange of te korte vraag wordt geweigerd", async () => {
  expect((await roep("zoek", { vraag: "x".repeat(501) })).fout).toBe(true);
  expect((await roep("zoek", { vraag: "x" })).fout).toBe(true);
  expect((await roep("zoek", { vraag: "loon", aantal: 11 })).fout).toBe(true);
});

test("lees_onderwerp geeft de hele pagina, met of zonder .md", async () => {
  for (const pagina of ["minimumloon", "minimumloon.md"]) {
    const { tekst, fout } = await roep("lees_onderwerp", { pagina });
    expect(fout).toBe(false);
    expect(tekst).toContain("# Minimumloon");
    expect(tekst).toContain("## Open vragen");
    expect(tekst).toContain("geen juridisch advies");
  }
});

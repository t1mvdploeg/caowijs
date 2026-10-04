// Maakt van de werkkopie van de kennisbank de openbare pagina's:
// elke verwijzing naar het lokale archief wordt een link naar het oorspronkelijke webadres.
// Gebruik: node scripts/publiceer-kennis.ts <werkkopie-kennis> <archief-info> <uitvoermap>
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export interface Bron {
  titel: string;
  url: string;
}

export const NIET_OPENBAAR = [
  "kostprijselementen.md",
  "toetsing-parameters.md",
];

// Archiefbestanden zonder "Bron:"-regel: pdf's die als tekst zijn opgeslagen.
export const VASTE_BRONNEN: Record<string, Bron> = {
  "abu.nl/documenten/CAO-voor-Uitzendkrachten-2026-2028-NL-webversie-mei-2026.md":
    {
      titel: "Cao voor Uitzendkrachten 2026-2028 (webversie mei 2026)",
      url: "https://www.abu.nl/app/uploads/2026/09/CAO-voor-Uitzendkrachten-2026-2028-NL-webversie-mei-2026.pdf",
    },
  "abu.nl/documenten/SFU-cao-2026.md": {
    titel: "SFU-cao 2026",
    url: "https://www.abu.nl/app/uploads/2026/08/SFU-cao-2026.pdf",
  },
  "abu.nl/documenten/Praktische-gids-klaar-voor-de-Wtta-ABU.md": {
    titel: "Praktische gids Klaar voor de Wtta (ABU)",
    url: "https://www.abu.nl/app/uploads/2026/06/Praktische-gids-klaar-voor-de-Wtta-ABU.pdf",
  },
  "wijzerbelonen.nl/Standaard-uitvraag-gelijkwaardig-belonen-2026.md": {
    titel: "Standaard uitvraag gelijkwaardig belonen 2026",
    url: "https://www.wijzerbelonen.nl/app/uploads/2026/03/Standaard-uitvraag-gelijkwaardig-belonen-2026.pdf",
  },
  "toelatinguitleenmarkt.nl/README.md": {
    titel: "toelatinguitleenmarkt.nl",
    url: "https://www.toelatinguitleenmarkt.nl/",
  },
};

const VERBODEN = [
  /docs\/info(?![a-z])/,
  /docs\/kennis/,
  /data\/parameters/,
  /src\/core/,
  /tarieftool/i,
  /rekentool/i,
  /kostprijselementen\.md/,
  /toetsing-parameters\.md/,
];

const ARCHIEFPAD = /`?docs\/info\/([^\s,;)`\]]+?\.md)`?/g;
const KENNISPAD = /`?docs\/kennis\/([a-z0-9-]+\.md)`?/g;

export function verboden(tekst: string): string[] {
  return VERBODEN.filter((patroon) => patroon.test(tekst)).map(String);
}

export function leesBron(infoMap: string, pad: string): Bron | undefined {
  if (VASTE_BRONNEN[pad]) return VASTE_BRONNEN[pad];
  const bestand = join(infoMap, pad);
  if (!existsSync(bestand)) return undefined;
  const kop = readFileSync(bestand, "utf8").split("\n").slice(0, 8);
  const titel = kop
    .find((regel) => regel.startsWith("# "))
    ?.slice(2)
    .trim();
  const url = kop
    .find((regel) => regel.startsWith("Bron:"))
    ?.match(/https?:\/\/\S+/)?.[0];
  return titel && url ? { titel, url } : undefined;
}

export function zetOm(
  tekst: string,
  zoekBron: (pad: string) => Bron | undefined,
): { tekst: string; onbekend: string[] } {
  const onbekend: string[] = [];
  const uit = tekst
    .replace(ARCHIEFPAD, (heel: string, pad: string) => {
      const bron = zoekBron(pad);
      if (!bron) {
        onbekend.push(pad);
        return heel;
      }
      const titel = bron.titel.replace(/[[\]]/g, "");
      const url = bron.url.replace(/\(/g, "%28").replace(/\)/g, "%29");
      return `[${titel}](${url})`;
    })
    .replace(KENNISPAD, "`$1`");
  return { tekst: uit, onbekend };
}

const INLEIDING = `# Kennisbank Cao voor Uitzendkrachten

Samenvattingen over de Cao voor Uitzendkrachten 2026-2028 en de regels eromheen, in eigen woorden. Elke feitelijke bewering heeft een link naar de bron. De datum bovenaan een pagina zegt hoe vers ze is.

Dit is geen juridisch advies. De bronnen blijven van hun rechthebbenden.

Elke pagina heeft dezelfde opbouw: wat nu geldt staat onder "Kern" en "Details", wat eerder gold onder "Historie", en wat de bronnen niet beantwoorden of waar ze elkaar tegenspreken onder "Open vragen".

Rangorde van bronnen: wetstekst, dan de cao-tekst, dan de instantie die iets vaststelt of uitvoert (StiPP, Belastingdienst, Rijksoverheid, NAU, SPAWW), dan wijzerbelonen.nl, dan uitleg van de SNCU, dan nieuwsberichten van ABU.

Hoe de pagina's zijn geschreven en nagelopen staat in \`docs/werkwijze/\`.

## Onderwerpen

| Pagina | Dekt |
|---|---|
`;

// De rijen van de overzichtstabel uit de werkkopie, zonder de pagina's die niet meegaan.
export function overzicht(werkReadme: string, paginas: string[]): string {
  const rijen = werkReadme
    .split("\n")
    .filter((regel) =>
      paginas.some((naam) => regel.startsWith(`| [${naam}](${naam})`)),
    );
  return INLEIDING + rijen.join("\n") + "\n";
}

function main(): void {
  const [werkkopie, infoMap, uitMap] = process.argv.slice(2);
  if (!werkkopie || !infoMap || !uitMap) {
    console.error(
      "Gebruik: node scripts/publiceer-kennis.ts <werkkopie-kennis> <archief-info> <uitvoermap>",
    );
    process.exit(1);
  }
  const fouten: string[] = [];
  const klaar: [string, string][] = [];
  const namen = readdirSync(werkkopie)
    .filter(
      (naam) =>
        naam.endsWith(".md") &&
        naam !== "README.md" &&
        !NIET_OPENBAAR.includes(naam),
    )
    .sort();
  for (const naam of namen) {
    const { tekst, onbekend } = zetOm(
      readFileSync(join(werkkopie, naam), "utf8"),
      (pad) => leesBron(infoMap, pad),
    );
    for (const pad of onbekend)
      fouten.push(`${naam}: geen webadres voor docs/info/${pad}`);
    for (const patroon of verboden(tekst))
      fouten.push(`${naam}: bevat ${patroon}`);
    klaar.push([naam, tekst]);
  }
  const readme = overzicht(
    readFileSync(join(werkkopie, "README.md"), "utf8"),
    namen,
  );
  for (const patroon of verboden(readme))
    fouten.push(`README.md: bevat ${patroon}`);
  for (const naam of namen)
    if (!readme.includes(`| [${naam}](${naam})`))
      fouten.push(`README.md: geen rij voor ${naam}`);
  klaar.push(["README.md", readme]);

  if (fouten.length) {
    console.error(fouten.join("\n"));
    console.error(`\n${fouten.length} fouten; er is niets geschreven.`);
    process.exit(1);
  }
  mkdirSync(uitMap, { recursive: true });
  for (const [naam, tekst] of klaar) writeFileSync(join(uitMap, naam), tekst);
  console.log(`${klaar.length} bestanden geschreven naar ${uitMap}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

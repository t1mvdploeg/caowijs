// Meet hoe vaak de zoekfunctie de juiste pagina vindt voor de vragen in evals/vragen.json.
// Gebruik: npm run meet
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { laadKennisbank, type Pagina } from "../src/kennisbank.ts";
import { maakZoekindex } from "../src/zoeken.ts";

export interface Vraag {
  vraag: string;
  pagina: string;
  ook?: string[];
}

export interface Meting {
  aantal: number;
  opEen: number;
  inTopDrie: number;
  gemist: string[];
}

export function meet(paginas: Pagina[], vragen: Vraag[]): Meting {
  const index = maakZoekindex(paginas);
  const meting: Meting = {
    aantal: vragen.length,
    opEen: 0,
    inTopDrie: 0,
    gemist: [],
  };
  for (const { vraag, pagina, ook = [] } of vragen) {
    const goed = new Set([pagina, ...ook]);
    const gevonden = index
      .zoek(vraag, { aantal: 3 })
      .map((treffer) => treffer.passage.pagina);
    if (goed.has(gevonden[0])) meting.opEen++;
    if (gevonden.some((naam) => goed.has(naam))) meting.inTopDrie++;
    else
      meting.gemist.push(
        `${vraag} -> verwacht ${pagina}, gevonden ${gevonden.join(", ") || "niets"}`,
      );
  }
  return meting;
}

export function laadVragen(): Vraag[] {
  return JSON.parse(
    readFileSync(join(import.meta.dirname, "vragen.json"), "utf8"),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const m = meet(
    laadKennisbank(join(import.meta.dirname, "..", "kennis")),
    laadVragen(),
  );
  const procent = (n: number) =>
    `${n} van ${m.aantal} (${Math.round((100 * n) / m.aantal)}%)`;
  console.log(`Juiste pagina in de bovenste drie: ${procent(m.inTopDrie)}`);
  console.log(`Juiste pagina op één:              ${procent(m.opEen)}`);
  for (const regel of m.gemist) console.log(`  gemist: ${regel}`);
}

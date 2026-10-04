import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Status = "geldt nu" | "historie" | "open vraag";

export interface Passage {
  pagina: string;
  titel: string;
  kop: string;
  status: Status;
  tekst: string;
}

export interface Pagina {
  naam: string;
  titel: string;
  dekt: string;
  geldigVoor: string;
  bijgewerkt: string;
  markdown: string;
  passages: Passage[];
}

const STATUS: Record<string, Status> = {
  Historie: "historie",
  "Open vragen": "open vraag",
};

export function leesPagina(
  bestandsnaam: string,
  markdown: string,
  dekt = "",
): Pagina {
  const naam = bestandsnaam.replace(/\.md$/, "");
  const regels = markdown.split("\n");
  const titel =
    regels
      .find((regel) => regel.startsWith("# "))
      ?.slice(2)
      .trim() ?? naam;
  const kopregel =
    regels.find((regel) => regel.startsWith("Geldig voor:")) ?? "";
  const bijgewerkt =
    kopregel.match(/Bijgewerkt: (\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
  const geldigVoor = kopregel
    .replace(/^Geldig voor:\s*/, "")
    .replace(/\s*Bijgewerkt:.*$/, "")
    .trim();

  const passages: Passage[] = [];
  let kop = "";
  let tussenkop = "";
  let blok: string[] = [];
  // De alinea direct vóór het huidige blok, zolang we in dezelfde sectie zitten.
  let inleiding: Passage | undefined;

  const sluit = (): void => {
    const tekst = blok.join("\n").trim();
    blok = [];
    if (!tekst || !kop || kop === "Bronnen") return;
    if (tekst.startsWith("|") && inleiding) {
      // Een tabel zonder de zin ervoor is niet te begrijpen: houd ze bij elkaar.
      inleiding.tekst += "\n\n" + tekst;
      inleiding = undefined;
      return;
    }
    const passage: Passage = {
      pagina: naam,
      titel,
      kop: tussenkop ? `${kop} · ${tussenkop}` : kop,
      status: STATUS[kop] ?? "geldt nu",
      tekst,
    };
    passages.push(passage);
    inleiding =
      tekst.startsWith("- ") || tekst.startsWith("|") ? undefined : passage;
  };

  for (const regel of regels) {
    if (regel.startsWith("## ")) {
      sluit();
      kop = regel.slice(3).trim();
      tussenkop = "";
      inleiding = undefined;
    } else if (regel.startsWith("### ")) {
      sluit();
      tussenkop = regel.slice(4).trim();
      inleiding = undefined;
    } else if (regel.trim() === "") {
      sluit();
    } else {
      if (regel.startsWith("- ") && blok.length) sluit();
      blok.push(regel);
    }
  }
  sluit();

  return { naam, titel, dekt, geldigVoor, bijgewerkt, markdown, passages };
}

export function laadKennisbank(map: string): Pagina[] {
  const namen = existsSync(map)
    ? readdirSync(map)
        .filter((naam) => naam.endsWith(".md") && naam !== "README.md")
        .sort()
    : [];
  if (!namen.length) throw new Error(`Geen kennispagina's gevonden in ${map}`);

  const dekt = new Map<string, string>();
  const readme = join(map, "README.md");
  if (existsSync(readme)) {
    const rij = /^\| \[([a-z0-9-]+)\.md\]\([^)]*\) \| (.+?) \|$/gm;
    for (const [, naam, tekst] of readFileSync(readme, "utf8").matchAll(rij))
      dekt.set(naam, tekst);
  }
  return namen.map((naam) =>
    leesPagina(
      naam,
      readFileSync(join(map, naam), "utf8"),
      dekt.get(naam.replace(/\.md$/, "")) ?? "",
    ),
  );
}

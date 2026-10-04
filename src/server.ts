import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Pagina } from "./kennisbank.ts";
import { maakZoekindex } from "./zoeken.ts";

const INSTRUCTIES = `Kennisbank over de Nederlandse Cao voor Uitzendkrachten 2026-2028 en de regels eromheen: gelijkwaardige beloning, minimumloon, pensioen (StiPP), premies, PAWW, fasen en uitzendbeding, ontslag, ziekte en vakantie, Wtta, SNCU en inlenersaansprakelijkheid.

Zo gebruik je haar:
- Begin met zoek. Vind je niets, probeer andere woorden of vraag de lijst op met onderwerpen.
- Noem bij elk feit de bron met de link die in het resultaat staat, en de plek erbij.
- Elk stuk heeft een etiket. "geldt nu" is de huidige regel. "historie" gold vroeger: presenteer het niet als geldend. "open vraag" betekent dat de bronnen het niet beantwoorden of elkaar tegenspreken: zeg dat erbij.
- Staat iets niet in de kennisbank, zeg dat dan. Vul het niet aan met eigen kennis zonder dat te melden.
- Dit zijn samenvattingen en geen juridisch advies. Noem de datum waarop de pagina is bijgewerkt als het om bedragen, percentages of data gaat.`;

const VOETNOOT =
  "Samenvatting in eigen woorden, geen juridisch advies. Controleer bij twijfel de bron.";

const tekst = (inhoud: string) => ({
  content: [{ type: "text" as const, text: inhoud }],
});
const fout = (inhoud: string) => ({ ...tekst(inhoud), isError: true });

export function maakServer(paginas: Pagina[]): McpServer {
  const index = maakZoekindex(paginas);
  const opNaam = new Map(paginas.map((pagina) => [pagina.naam, pagina]));
  const namen = [...opNaam.keys()].join(", ");
  // Alleen namen uit de geladen lijst worden geaccepteerd, dus er is geen weg naar andere bestanden.
  const vind = (naam: string) => opNaam.get(naam.replace(/\.md$/, ""));
  const onbekend = (naam: string) =>
    fout(`Onbekend onderwerp "${naam}". Geldige namen: ${namen}.`);
  const alleenLezen = { readOnlyHint: true, openWorldHint: false };

  const server = new McpServer(
    { name: "caowijs", version: "0.1.0" },
    { instructions: INSTRUCTIES },
  );

  server.registerTool(
    "onderwerpen",
    {
      title: "Onderwerpen van de cao-kennisbank",
      description:
        "Geeft de lijst met onderwerpen in de kennisbank over de Cao voor Uitzendkrachten: per pagina de naam, wat ze dekt, voor welke periode ze geldt en wanneer ze is bijgewerkt. Gebruik dit om te zien wat de kennisbank bevat, of als zoeken niets oplevert.",
      annotations: alleenLezen,
    },
    async () =>
      tekst(
        paginas
          .map(
            (p) =>
              `- ${p.naam} — ${p.titel}. ${p.dekt}\n  Geldig voor: ${p.geldigVoor} Bijgewerkt: ${p.bijgewerkt}`,
          )
          .join("\n") + `\n\n${VOETNOOT}`,
      ),
  );

  server.registerTool(
    "zoek",
    {
      title: "Zoek in de cao-kennisbank",
      description:
        'Zoekt op trefwoorden in de kennisbank over de Cao voor Uitzendkrachten en geeft de best passende stukken tekst terug, elk met een etiket (geldt nu, historie of open vraag), de pagina en de bron als link. Stel de vraag in gewone Nederlandse woorden, bijvoorbeeld "wachtdagen bij ziekte" of "transitievergoeding berekenen".',
      inputSchema: {
        vraag: z
          .string()
          .min(2)
          .max(500)
          .describe("De vraag of de zoekwoorden, in het Nederlands."),
        onderwerp: z
          .string()
          .max(100)
          .optional()
          .describe(
            "Naam van één pagina om binnen te zoeken, zoals de tool onderwerpen die geeft. Laat weg om overal te zoeken.",
          ),
        aantal: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Aantal resultaten, standaard 5."),
      },
      annotations: alleenLezen,
    },
    async ({ vraag, onderwerp, aantal }) => {
      const pagina = onderwerp === undefined ? undefined : vind(onderwerp);
      if (onderwerp !== undefined && !pagina) return onbekend(onderwerp);
      const treffers = index.zoek(vraag, { pagina: pagina?.naam, aantal });
      if (!treffers.length)
        return tekst(
          `Niets gevonden voor "${vraag}". Probeer andere zoekwoorden, of vraag de lijst op met de tool onderwerpen. Staat het daar ook niet, dan bevat de kennisbank het niet.`,
        );
      const stukken = treffers.map(({ passage }, i) => {
        const bijgewerkt = opNaam.get(passage.pagina)?.bijgewerkt ?? "onbekend";
        const zonderBron = /\]\(https?:\/\//.test(passage.tekst)
          ? ""
          : "\n\nGeen bronlink bij dit stuk: lees de pagina voor de bron.";
        return `### ${i + 1}. ${passage.titel} — ${passage.status}\nPagina: ${passage.pagina} (bijgewerkt ${bijgewerkt}) · ${passage.kop}\n\n${passage.tekst}${zonderBron}`;
      });
      return tekst(`${stukken.join("\n\n")}\n\n---\n${VOETNOOT}`);
    },
  );

  server.registerTool(
    "lees_onderwerp",
    {
      title: "Lees een pagina van de cao-kennisbank",
      description:
        "Geeft één hele pagina van de kennisbank, met de opbouw Kern, Details, Historie, Open vragen en Bronnen. Gebruik dit als je de samenhang nodig hebt of als een zoekresultaat te weinig context geeft.",
      inputSchema: {
        pagina: z
          .string()
          .min(1)
          .max(100)
          .describe("Naam van de pagina, zoals de tool onderwerpen die geeft."),
      },
      annotations: alleenLezen,
    },
    async ({ pagina }) => {
      const gevonden = vind(pagina);
      return gevonden
        ? tekst(`${gevonden.markdown}\n\n---\n${VOETNOOT}`)
        : onbekend(pagina);
    },
  );

  return server;
}

import { expect, test } from "vitest";
import { leesPagina } from "../src/kennisbank.ts";
import { maakZoekindex, woorden } from "../src/zoeken.ts";

const paginas = [
  leesPagina(
    "ontslag.md",
    "# Ontslag en transitievergoeding\n\n## Kern\n\n- De transitievergoeding is een derde maandloon per dienstjaar.\n- De opzegtermijn is één maand.\n\n## Historie\n\n- Vóór 2020 gold de vergoeding pas na twee jaar.\n",
  ),
  leesPagina(
    "ziekte.md",
    "# Ziekte en verlof\n\n## Kern\n\n- Bij ziekte geldt hooguit twee wachtdagen.\n- Loondoorbetaling bij ziekte is 70% van het loon.\n",
  ),
];
const index = maakZoekindex(paginas);

test("woorden: kleine letters, zonder accenten, zonder stopwoorden en webadressen", () => {
  expect(
    woorden(
      "Wat ís de Opzegtermijn? Zie [de wet](https://wetten.overheid.nl/x).",
    ),
  ).toEqual(["opzegtermijn", "zie", "wet"]);
});

test("woorden: meervoud en enkelvoud geven dezelfde vorm", () => {
  expect(woorden("wachtdagen")).toEqual(woorden("wachtdag"));
  expect(woorden("vergoedingen")).toEqual(woorden("vergoeding"));
  expect(woorden("premies")).toEqual(woorden("premie"));
});

test("vindt het stuk dat de vraag beantwoordt", () => {
  expect(
    index.zoek("hoeveel wachtdagen bij ziekte")[0].passage.tekst,
  ).toContain("twee wachtdagen");
});

test("een zoekwoord vindt ook een samenstelling", () => {
  expect(index.zoek("vergoeding").map((t) => t.passage.pagina)).toContain(
    "ontslag",
  );
  expect(index.zoek("transitie")[0].passage.pagina).toBe("ontslag");
});

test("hoofdletters, accenten en leestekens maken niet uit", () => {
  const kaal = index.zoek("wachtdagen ziekte").map((t) => t.passage.tekst);
  expect(
    index.zoek("Wáchtdagen bij ZIEKTE?!").map((t) => t.passage.tekst),
  ).toEqual(kaal);
});

test("een vraag zonder zoekbare woorden geeft niets terug", () => {
  expect(index.zoek("wat is het?")).toEqual([]);
  expect(index.zoek("???")).toEqual([]);
  expect(index.zoek("kwantumfysica")).toEqual([]);
});

test("beperken tot één pagina en tot een aantal", () => {
  expect(
    index
      .zoek("vergoeding loon", { pagina: "ziekte" })
      .every((t) => t.passage.pagina === "ziekte"),
  ).toBe(true);
  expect(
    index.zoek("vergoeding loon ziekte opzegtermijn", { aantal: 2 }),
  ).toHaveLength(2);
});

test("een woord uit de titel haalt de pagina omhoog", () => {
  expect(index.zoek("verlof")[0].passage.pagina).toBe("ziekte");
});

test("dezelfde vraag geeft twee keer dezelfde volgorde", () => {
  const eerste = index.zoek("loon vergoeding").map((t) => t.passage.tekst);
  expect(index.zoek("loon vergoeding").map((t) => t.passage.tekst)).toEqual(
    eerste,
  );
});

test("een woord uit de beschrijving van de pagina vindt die pagina", () => {
  const metBeschrijving = maakZoekindex([
    leesPagina(
      "ziekte.md",
      "# Ziekte en verlof\n\n## Kern\n\n- Bij ziekte geldt hooguit twee wachtdagen.\n",
      "Ziekte, wachtdagen, einde reserveringssystematiek",
    ),
  ]);
  expect(
    metBeschrijving.zoek("reserveringssystematiek")[0]?.passage.pagina,
  ).toBe("ziekte");
  expect(index.zoek("reserveringssystematiek")).toEqual([]);
});

test("een woord in de titel weegt zwaarder dan vier keer hetzelfde woord in de tekst", () => {
  const titelIndex = maakZoekindex([
    leesPagina(
      "tekst.md",
      "# Overig\n\n## Kern\n\n- Pensioen pensioen pensioen pensioen en niets anders hier.\n",
    ),
    leesPagina(
      "titel.md",
      "# Pensioen\n\n## Kern\n\n- Een alinea over iets anders dan het gezochte woord hier.\n",
    ),
  ]);
  expect(titelIndex.zoek("pensioen")[0].passage.pagina).toBe("titel");
});

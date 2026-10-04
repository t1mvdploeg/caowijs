import type { Pagina, Passage } from "./kennisbank.ts";

const STOPWOORDEN = new Set(
  (
    "de het een en of van in op is zijn was voor bij te dat die dit deze met als aan er om " +
    "wat hoe wie waar wanneer welke welk waarom hoeveel mag moet kan kunnen moeten mogen " +
    "ik je jij u mijn we wij hij zij ze hem haar hun ons " +
    "naar door over uit tot niet wel ook nog dan maar heeft hebben wordt worden geldt gelden krijgt krijgen"
  ).split(" "),
);

// Meervoud en verbuiging eraf, zodat "wachtdagen" en "wachtdag" hetzelfde woord zijn.
function stam(woord: string): string {
  return woord.length >= 6 ? woord.replace(/(en|es|e|s)$/, "") : woord;
}

export function woorden(tekst: string): string[] {
  return tekst
    .replace(/\]\([^)]*\)/g, "] ") // het webadres van een link telt niet mee
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((woord) => woord.length > 1 && !STOPWOORDEN.has(woord))
    .map(stam);
}

export interface Treffer {
  passage: Passage;
  score: number;
}

export interface Zoekindex {
  zoek(vraag: string, opties?: { pagina?: string; aantal?: number }): Treffer[];
}

// BM25, de gangbare formule voor zoeken op trefwoorden.
const K1 = 1.2;
const B = 0.75;
// Een woord in de titel of tussenkop telt zwaarder dan een woord in de tekst.
const TITEL_TELT = 5;

export function maakZoekindex(paginas: Pagina[]): Zoekindex {
  const stukken = paginas
    .flatMap((pagina) =>
      pagina.passages.map((passage) => ({ passage, dekt: pagina.dekt })),
    )
    .map(({ passage, dekt }) => {
      const telling = new Map<string, number>();
      const tel = (woord: string, keer: number) =>
        telling.set(woord, (telling.get(woord) ?? 0) + keer);
      for (const woord of woorden(passage.tekst)) tel(woord, 1);
      const tussenkop = passage.kop.split(" · ")[1] ?? "";
      for (const woord of woorden(`${passage.titel} ${tussenkop}`))
        tel(woord, TITEL_TELT);
      // De beschrijving van de pagina telt licht mee voor elk stuk van die pagina.
      for (const woord of woorden(dekt)) tel(woord, 1);
      let lengte = 0;
      for (const keer of telling.values()) lengte += keer;
      return { passage, telling, lengte };
    });
  const gemiddeld =
    stukken.reduce((som, stuk) => som + stuk.lengte, 0) / (stukken.length || 1);

  return {
    zoek(vraag, { pagina, aantal = 5 } = {}) {
      const scores = new Map<number, number>();
      for (const term of new Set(woorden(vraag))) {
        // Vanaf vier letters vindt een zoekwoord ook samenstellingen ("vergoeding" in "transitievergoeding").
        const past = (woord: string) =>
          term.length >= 4 ? woord.includes(term) : woord === term;
        // ponytail: elke zoekterm loopt alle stukken langs. Prima tot enkele duizenden stukken;
        // daarboven een omgekeerde index (woord -> stukken) bouwen.
        const keren = stukken.map((stuk) => {
          let n = 0;
          for (const [woord, keer] of stuk.telling) if (past(woord)) n += keer;
          return n;
        });
        const metTerm = keren.filter((n) => n > 0).length;
        if (!metTerm) continue;
        const zeldzaamheid = Math.log(
          1 + (stukken.length - metTerm + 0.5) / (metTerm + 0.5),
        );
        keren.forEach((n, i) => {
          if (!n) return;
          const norm = n + K1 * (1 - B + (B * stukken[i].lengte) / gemiddeld);
          scores.set(
            i,
            (scores.get(i) ?? 0) + (zeldzaamheid * n * (K1 + 1)) / norm,
          );
        });
      }
      return [...scores]
        .map(([i, score]) => ({ passage: stukken[i].passage, score, i }))
        .filter((treffer) => !pagina || treffer.passage.pagina === pagina)
        .sort((a, b) => b.score - a.score || a.i - b.i)
        .slice(0, aantal)
        .map(({ passage, score }) => ({ passage, score }));
    },
  };
}

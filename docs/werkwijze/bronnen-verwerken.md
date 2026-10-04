# Opdracht: nieuwe bronnen verwerken in de cao-kennisbank

Zo is de kennisbank op 4 oktober 2026 uitgebreid: per groep pagina's schreef één AI-agent de tekst, en daarna zocht een tweede agent, die de tekst niet had geschreven, elke bewering terug in de bron. Dit is de opdracht die de agents kregen. Het ruwe archief met de bronpagina's (`info/`) zit niet in deze repository; de bronverwijzingen in de pagina's zijn links naar de openbare bron.

Je werkt aan een kennisbank over de Nederlandse Cao voor Uitzendkrachten 2026-2028. De lezers zijn een uitzendbureau (werkgeverskant: kostprijs, cao-regels, pensioen, naleving) en AI-agents die er vragen mee beantwoorden. De kennisbank heeft een ruw archief en daarboven korte onderwerppagina's. Op 4 oktober 2026 is het archief uitgebreid met acht nieuwe sites. Jouw taak: die nieuwe bronnen verwerken in de onderwerppagina's die jij beheert. Welke pagina's en bronnen dat zijn, staat in je eigen opdracht.

## Opbouw

- `kennis/`: de onderwerppagina's. Lees eerst `kennis/README.md` (de vaste opbouw van een pagina) en één bestaande pagina, bijvoorbeeld `kennis/wtta.md`, voor vorm en toon.
- `info/<site>/`: het ruwe archief. Elke site heeft een `README.md` met de lijst van pagina's en documenten. Begin daar en lees gericht; gebruik grep waar een bestand groot is.
- In de onderwerppagina's heet het archief `docs/info/...`. Houd dat aan: `docs/info/X` in een bronverwijzing is het bestand `info/X` in deze map.

Oude sites (al verwerkt in september): `abu.nl`, `wijzerbelonen.nl`. Nieuwe sites: `stippensioen.nl`, `spaww.nl`, `sncu.nl`, `toelatinguitleenmarkt.nl`, `werkenalsuitzendkracht.nl`, `belastingdienst.nl`, `rijksoverheid.nl`, `wetten.overheid.nl`.

## Regels voor de inhoud

1. Elke feitelijke bewering (bedrag, percentage, datum, artikelnummer, regel) krijgt inline een bron in de vorm `(bron: docs/info/<pad>.md, <kop, artikel of lid>)`. Je schrijft alleen op wat je zelf in dat bestand hebt gelezen. Neem getallen letterlijk over.
2. Rangorde van bronnen: wetstekst (`wetten.overheid.nl`), dan de cao-tekst (`abu.nl/documenten/CAO-...`), dan de instantie die iets vaststelt of uitvoert (StiPP, Belastingdienst, Rijksoverheid, NAU, SPAWW), dan wijzerbelonen.nl, dan uitleg van de SNCU, dan nieuwsberichten van ABU. Bij bedragen en percentages gaat de instantie die ze vaststelt boven een overzichtstabel van ABU.
3. Spreken bronnen elkaar tegen: zet de hoogste in de tekst en beschrijf de tegenspraak onder "Open vragen", met beide bronnen.
4. Bestaande, onderbouwde inhoud laat je staan. Is iets achterhaald door een nieuwe bron, verplaats het dan kort naar "Historie". Een open vraag die nu beantwoord is, haal je weg uit "Open vragen" en verwerk je met bron in de tekst.
5. Vind je iets niet in de bronnen, dan staat het niet op de pagina of komt het onder "Open vragen". Geen eigen kennis, geen aannames, geen advies.
6. Schrijf in gewoon Nederlands, kort en feitelijk. Een pagina is het liefst 400 tot 1.200 woorden. Wordt een onderwerp groter, splits dan naar een van de nieuwe pagina's uit je opdracht in plaats van de pagina te laten uitdijen.
7. Een nieuwe pagina volgt de vaste opbouw: Kern, Details, Historie, Open vragen, Bronnen.
8. Zet bovenaan elke pagina die je aanraakt `Bijgewerkt: 2026-10-04` en vul de lijst "Bronnen" onderaan aan.
9. Verwijs niet naar interne projecten of naar personen.

## Regels voor het werk

- Je schrijft alleen in de pagina's uit je eigen opdracht. Andere pagina's in `kennis/` (ook `README.md`), alles in `info/`, `scrape/`, `skill/` en alles buiten deze map raak je niet aan. Andere agents werken nu tegelijk aan de andere pagina's. Verwijzen naar een andere pagina mag, met de bestandsnaam.
- Geen git. Geen nieuwe bronnen van internet ophalen: je werkt alleen met wat in `info/` staat.
- Is een bronbestand een scan zonder tekst of duidelijk kapot, sla het over en meld het.

## Wat ik terug wil (kort, in het Nederlands)

- Per pagina: wat is toegevoegd, wat is gewijzigd, wat is naar Historie gegaan.
- Welke open vragen zijn beantwoord (met bron) en welke blijven staan.
- Nieuwe tegenstrijdigheden tussen bronnen.
- Bronnen die relevant leken maar die je niet hebt kunnen lezen of verwerken, en punten waar je zelf over twijfelt.

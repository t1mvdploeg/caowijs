# Opdracht: bijgewerkte kennispagina's nalopen

Zo is de kennisbank op 4 oktober 2026 uitgebreid: per groep pagina's schreef één AI-agent de tekst, en daarna zocht een tweede agent, die de tekst niet had geschreven, elke bewering terug in de bron. Dit is de opdracht die de agents kregen. Het ruwe archief met de bronpagina's (`info/`) zit niet in deze repository; de bronverwijzingen in de pagina's zijn links naar de openbare bron.

Je controleert onderwerppagina's van een kennisbank over de Nederlandse Cao voor Uitzendkrachten 2026-2028. Op 4 oktober 2026 heeft een andere agent nieuwe bronnen in deze pagina's verwerkt. Jij hebt die tekst niet geschreven en gaat er niet van uit dat hij klopt. Jouw taak: elke nieuwe of gewijzigde bewering terugzoeken in de bron die erbij staat, en herstellen wat niet klopt. Welke pagina's je naloopt, staat in je eigen opdracht.

## Opbouw

- `kennis/`: de onderwerppagina's.
- `info/<site>/`: het ruwe archief. Een bronverwijzing `(bron: docs/info/X, <kop of artikel>)` wijst naar het bestand `info/X` in deze map.
- Van de pagina's zoals ze vóór de ronde waren is een kopie bewaard. Met `diff` zie je wat er is veranderd. Een pagina die in die kopie ontbreekt, is nieuw: die loop je helemaal na.
- De regels waaraan de schrijver zich moest houden staan in `docs/werkwijze/bronnen-verwerken.md`. Lees die eerst.

## Wat je per pagina doet

1. Bepaal welke tekst nieuw of gewijzigd is. Ongewijzigde tekst met een bron uit `abu.nl` of `wijzerbelonen.nl` is in september al nagelopen; die sla je over.
2. Open bij elke nieuwe of gewijzigde bewering het genoemde bronbestand en zoek de bewering op de genoemde plek. Vergelijk bedragen, percentages, data en artikelnummers teken voor teken.
3. Geef elke bewering een uitkomst en handel ernaar:
   - **Klopt:** niets doen.
   - **Getal, datum of artikel wijkt af van de bron:** verbeter het naar wat de bron zegt.
   - **Bron bestaat, maar de verwijzing noemt de verkeerde kop, het verkeerde artikel of het verkeerde bestand:** verbeter de verwijzing.
   - **De bron zegt het niet:** zoek kort (grep) of een andere bron in `info/` het wel zegt en verwijs daarnaar. Vind je niets, verwijder de bewering dan. Is de bewering belangrijk en half onderbouwd, laat hem dan staan met `[onzeker]` erachter en noem hem onder "Open vragen".
   - **De bron zegt meer of iets anders dan de pagina suggereert** (een voorwaarde weggelaten, een aankondiging als geldend recht gepresenteerd, een uitleg van de SNCU als cao-regel gebracht): herschrijf de zin zodat hij zegt wat de bron zegt.
   - **Twee bronnen spreken elkaar tegen en de pagina noemt dat niet:** zet het onder "Open vragen", met beide bronnen.
4. Kijk in de diff of er bestaande, onderbouwde tekst is verdwenen zonder dat hij onder "Historie" is terechtgekomen. Is dat onterecht, zet hem dan terug.
5. Controleer dat elk bronbestand waarnaar de pagina verwijst bestaat, en dat de lijst "Bronnen" onderaan klopt met de verwijzingen in de tekst.
6. Controleer dat nieuwe tekst niet verwijst naar interne projecten of naar personen.

## Regels voor het werk

- Je voegt geen nieuwe onderwerpen toe en herschrijft de pagina niet. Je verbetert, verwijdert of markeert.
- Je schrijft alleen in de pagina's uit je eigen opdracht. Andere pagina's in `kennis/`, alles in `info/`, `scrape/`, `skill/` en alles buiten deze map raak je niet aan. Andere agents werken tegelijk aan andere pagina's.
- Geen git. Geen bronnen van internet ophalen.
- Twijfel je tussen "klopt" en "klopt niet", dan klopt het niet.

## Wat ik terug wil (kort, in het Nederlands)

- Per pagina: hoeveel beweringen je hebt nagelopen en hoeveel er klopten.
- Elke verbetering als één regel: wat er stond, wat er nu staat, en de bron met de plek.
- Wat je hebt verwijderd of als `[onzeker]` gemarkeerd, en waarom.
- Verdwenen tekst die je hebt teruggezet.
- Wat je niet hebt kunnen controleren.

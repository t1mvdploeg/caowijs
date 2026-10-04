import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { join } from "node:path";
import { laadKennisbank } from "./kennisbank.ts";
import { maakServer } from "./server.ts";

// stdout is van het MCP-protocol; meldingen gaan naar stderr.
try {
  const paginas = laadKennisbank(join(import.meta.dirname, "..", "kennis"));
  await maakServer(paginas).connect(new StdioServerTransport());
  console.error(`caowijs: ${paginas.length} pagina's geladen`);
} catch (fout) {
  console.error(
    `caowijs kan niet starten: ${fout instanceof Error ? fout.message : fout}`,
  );
  process.exit(1);
}

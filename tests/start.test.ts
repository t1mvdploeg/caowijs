import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join } from "node:path";
import { expect, test } from "vitest";

test("de server start op stdio en beantwoordt een echte vraag uit de kennisbank", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(import.meta.dirname, "..", "src", "start.ts")],
    stderr: "ignore",
  });
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(transport);
  try {
    expect((await client.listTools()).tools).toHaveLength(3);
    const uit = (await client.callTool({
      name: "zoek",
      arguments: { vraag: "minimumloon per uur 1 juli 2026" },
    })) as {
      content: { text: string }[];
    };
    expect(uit.content[0].text).toContain("Pagina: minimumloon");
    expect(uit.content[0].text).toContain("](https://");
  } finally {
    await client.close();
  }
}, 20_000);

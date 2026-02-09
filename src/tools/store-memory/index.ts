import { z } from "zod";
import { db } from "../../db/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const stmtInsert = db.prepare(`
  INSERT INTO memories (key, value, metadata, created_at, updated_at)
  VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    metadata = excluded.metadata,
    updated_at = CURRENT_TIMESTAMP
`);

export const storeMemorySchema = z.object({
    key: z.string().describe("Unique identifier for the memory"),
    value: z.string().describe("The memory content to store"),
    metadata: z.string().optional().describe("Optional JSON metadata as a string"),
});

export function registerStoreMemory(server: McpServer) {
    server.registerTool(
        "store_memory",
        {
            description: "Store a key-value pair with optional metadata in the memory database",
            inputSchema: storeMemorySchema,
        },
        async (args: z.infer<typeof storeMemorySchema>) => {
            const { key, value, metadata } = args;
            try {
                if (metadata) {
                    JSON.parse(metadata);
                }
                stmtInsert.run(key, value, metadata || null);
                return {
                    content: [{ type: "text", text: JSON.stringify({ success: true, message: "Memory stored successfully", key }) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error storing memory: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        },
    );
}

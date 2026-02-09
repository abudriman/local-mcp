import { z } from "zod";
import { db, MemoryRow } from "../../db/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const stmtSelect = db.prepare(`
  SELECT key, value, metadata, created_at, updated_at
  FROM memories
  WHERE key = ?
`);

export const retrieveMemorySchema = z.object({
    key: z.string().describe("Unique identifier for the memory to retrieve"),
});

export function registerRetrieveMemory(server: McpServer) {
    server.registerTool(
        "retrieve_memory",
        {
            description: "Retrieve a memory by its key",
            inputSchema: retrieveMemorySchema,
        },
        async (args: z.infer<typeof retrieveMemorySchema>) => {
            const { key } = args;
            try {
                const row = stmtSelect.get(key) as MemoryRow | undefined;
                if (!row) {
                    return {
                        content: [{ type: "text", text: JSON.stringify({ success: false, message: `Memory not found: ${key}` }) }],
                        isError: true,
                    };
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                key: row.key,
                                value: row.value,
                                metadata: row.metadata ? JSON.parse(row.metadata) : null,
                                created_at: row.created_at,
                                updated_at: row.updated_at,
                            }),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error retrieving memory: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        },
    );
}

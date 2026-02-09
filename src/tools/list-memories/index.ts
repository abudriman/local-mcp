import { z } from "zod";
import { db, MemoryRow } from "../../db/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const stmtSelectAll = db.prepare(`
  SELECT key, value, metadata, created_at, updated_at
  FROM memories
  ORDER BY updated_at DESC
`);

export const listMemoriesSchema = z.object({
    limit: z.number().int().positive().optional().describe("Maximum number of memories to return"),
});

export function registerListMemories(server: McpServer) {
    server.registerTool(
        "list_memories",
        {
            description: "List all memories in the database, optionally limited",
            inputSchema: listMemoriesSchema,
        },
        async (args: z.infer<typeof listMemoriesSchema>) => {
            const { limit } = args;
            try {
                let rows: MemoryRow[];
                if (limit) {
                    rows = db
                        .prepare(`
              SELECT key, value, metadata, created_at, updated_at
              FROM memories
              ORDER BY updated_at DESC
              LIMIT ?
            `)
                        .all(limit) as MemoryRow[];
                } else {
                    rows = stmtSelectAll.all() as MemoryRow[];
                }

                const memories = rows.map((row) => ({
                    key: row.key,
                    value: row.value,
                    metadata: row.metadata ? JSON.parse(row.metadata) : null,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                }));

                return {
                    content: [{ type: "text", text: JSON.stringify({ success: true, count: memories.length, memories }) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error listing memories: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        },
    );
}

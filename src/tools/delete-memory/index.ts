import { z } from "zod";
import { db } from "../../db/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const stmtDelete = db.prepare(`
  DELETE FROM memories WHERE key = ?
`);

export const deleteMemorySchema = z.object({
    key: z.string().describe("Unique identifier for the memory to delete"),
});

export function registerDeleteMemory(server: McpServer) {
    server.registerTool(
        "delete_memory",
        {
            description: "Delete a memory by its key",
            inputSchema: deleteMemorySchema,
        },
        async (args: z.infer<typeof deleteMemorySchema>) => {
            const { key } = args;
            try {
                const info = stmtDelete.run(key);
                if (info.changes === 0) {
                    return {
                        content: [{ type: "text", text: JSON.stringify({ success: false, message: `Memory not found: ${key}` }) }],
                        isError: true,
                    };
                }
                return {
                    content: [{ type: "text", text: JSON.stringify({ success: true, message: "Memory deleted successfully", key }) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error deleting memory: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        },
    );
}

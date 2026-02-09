#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Database } from "bun:sqlite";

// Database setup
const DB_PATH = process.env.MEMORY_DB_PATH || "./memory.db";
const db = new Database(DB_PATH);

// Initialize database schema
db.run(`
  CREATE TABLE IF NOT EXISTS memories (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Prepare statements for better performance
const stmtInsert = db.prepare(`
  INSERT INTO memories (key, value, metadata, created_at, updated_at)
  VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    metadata = excluded.metadata,
    updated_at = CURRENT_TIMESTAMP
`);

const stmtSelect = db.prepare(`
  SELECT key, value, metadata, created_at, updated_at
  FROM memories
  WHERE key = ?
`);

const stmtSelectAll = db.prepare(`
  SELECT key, value, metadata, created_at, updated_at
  FROM memories
  ORDER BY updated_at DESC
`);

const stmtDelete = db.prepare(`
  DELETE FROM memories WHERE key = ?
`);

// Create MCP server
const server = new McpServer({
    name: "memory-server",
    version: "0.1.0",
});

// Tool: store_memory
server.registerTool(
    "store_memory",
    {
        description: "Store a key-value pair with optional metadata in the memory database",
        inputSchema: z.object({
            key: z.string().describe("Unique identifier for the memory"),
            value: z.string().describe("The memory content to store"),
            metadata: z.string().optional().describe("Optional JSON metadata as a string"),
        }),
    },
    async (args) => {
        const { key, value, metadata } = args as { key: string; value: string; metadata?: string };

        try {
            // Validate metadata is valid JSON if provided
            if (metadata) {
                JSON.parse(metadata);
            }

            stmtInsert.run(key, value, metadata || null);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: `Memory stored successfully`,
                            key,
                        }),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error storing memory: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    },
);

// Tool: retrieve_memory
server.registerTool(
    "retrieve_memory",
    {
        description: "Retrieve a memory by its key",
        inputSchema: z.object({
            key: z.string().describe("Unique identifier for the memory to retrieve"),
        }),
    },
    async (args) => {
        const { key } = args as { key: string };

        try {
            const row = stmtSelect.get(key) as { key: string; value: string; metadata: string | null; created_at: string; updated_at: string } | undefined;

            if (!row) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                message: `Memory not found: ${key}`,
                            }),
                        },
                    ],
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
                content: [
                    {
                        type: "text",
                        text: `Error retrieving memory: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    },
);

// Tool: list_memories
server.registerTool(
    "list_memories",
    {
        description: "List all memories in the database, optionally limited",
        inputSchema: z.object({
            limit: z.number().int().positive().optional().describe("Maximum number of memories to return"),
        }),
    },
    async (args) => {
        const { limit } = args as { limit?: number };

        try {
            let rows: Array<{ key: string; value: string; metadata: string | null; created_at: string; updated_at: string }>;

            if (limit) {
                rows = db.prepare(`
          SELECT key, value, metadata, created_at, updated_at
          FROM memories
          ORDER BY updated_at DESC
          LIMIT ?
        `).all(limit) as Array<{ key: string; value: string; metadata: string | null; created_at: string; updated_at: string }>;
            } else {
                rows = stmtSelectAll.all() as Array<{ key: string; value: string; metadata: string | null; created_at: string; updated_at: string }>;
            }

            const memories = rows.map(row => ({
                key: row.key,
                value: row.value,
                metadata: row.metadata ? JSON.parse(row.metadata) : null,
                created_at: row.created_at,
                updated_at: row.updated_at,
            }));

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            count: memories.length,
                            memories,
                        }),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error listing memories: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    },
);

// Tool: delete_memory
server.registerTool(
    "delete_memory",
    {
        description: "Delete a memory by its key",
        inputSchema: z.object({
            key: z.string().describe("Unique identifier for the memory to delete"),
        }),
    },
    async (args) => {
        const { key } = args as { key: string };

        try {
            const info = stmtDelete.run(key);

            if (info.changes === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                message: `Memory not found: ${key}`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: `Memory deleted successfully`,
                            key,
                        }),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error deleting memory: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    },
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`Memory MCP server running (DB: ${DB_PATH})`);

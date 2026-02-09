#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerStoreMemory } from "./tools/store-memory/index.js";
import { registerRetrieveMemory } from "./tools/retrieve-memory/index.js";
import { registerListMemories } from "./tools/list-memories/index.js";
import { registerDeleteMemory } from "./tools/delete-memory/index.js";

// Create MCP server
const server = new McpServer({
    name: "local-mcp-server",
    version: "0.1.0",
});

// Register all memory tools
registerStoreMemory(server);
registerRetrieveMemory(server);
registerListMemories(server);
registerDeleteMemory(server);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`Memory MCP server running (DB: ${process.env.MEMORY_DB_PATH || "./memory.db"})`);

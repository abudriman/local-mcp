#!/usr/bin/env bun
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var zod_1 = require("zod");
var bun_sqlite_1 = require("bun:sqlite");
// Database setup
var DB_PATH = process.env.MEMORY_DB_PATH || "./memory.db";
var db = new bun_sqlite_1.Database(DB_PATH);
// Initialize database schema
db.run("\n  CREATE TABLE IF NOT EXISTS memories (\n    key TEXT PRIMARY KEY,\n    value TEXT NOT NULL,\n    metadata TEXT,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n  )\n");
// Prepare statements for better performance
var stmtInsert = db.prepare("\n  INSERT INTO memories (key, value, metadata, created_at, updated_at)\n  VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)\n  ON CONFLICT(key) DO UPDATE SET\n    value = excluded.value,\n    metadata = excluded.metadata,\n    updated_at = CURRENT_TIMESTAMP\n");
var stmtSelect = db.prepare("\n  SELECT key, value, metadata, created_at, updated_at\n  FROM memories\n  WHERE key = ?\n");
var stmtSelectAll = db.prepare("\n  SELECT key, value, metadata, created_at, updated_at\n  FROM memories\n  ORDER BY updated_at DESC\n");
var stmtDelete = db.prepare("\n  DELETE FROM memories WHERE key = ?\n");
// Response schema
var memoryResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string().optional(),
    key: zod_1.z.string(),
    value: zod_1.z.string(),
    metadata: zod_1.z.any().optional(),
    created_at: zod_1.z.string().optional(),
    updated_at: zod_1.z.string().optional(),
});
var listResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    count: zod_1.z.number(),
    memories: zod_1.z.array(memoryResponseSchema),
});
// Create MCP server
var server = new mcp_js_1.McpServer({
    name: "memory-server",
    version: "0.1.0",
});
// Tool: store_memory
server.registerTool("store_memory", {
    description: "Store a key-value pair with optional metadata in the memory database",
    inputSchema: zod_1.z.object({
        key: zod_1.z.string().describe("Unique identifier for the memory"),
        value: zod_1.z.string().describe("The memory content to store"),
        metadata: zod_1.z.string().optional().describe("Optional JSON metadata as a string"),
    }),
    outputSchema: zod_1.z.object({
        success: zod_1.z.boolean(),
        message: zod_1.z.string(),
        key: zod_1.z.string(),
    }),
}, function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, key, value, metadata;
    return __generator(this, function (_b) {
        _a = args, key = _a.key, value = _a.value, metadata = _a.metadata;
        try {
            // Validate metadata is valid JSON if provided
            if (metadata) {
                JSON.parse(metadata);
            }
            stmtInsert.run(key, value, metadata || null);
            return [2 /*return*/, {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                message: "Memory stored successfully",
                                key: key,
                            }),
                        },
                    ],
                }];
        }
        catch (error) {
            return [2 /*return*/, {
                    content: [
                        {
                            type: "text",
                            text: "Error storing memory: ".concat(error instanceof Error ? error.message : String(error)),
                        },
                    ],
                    isError: true,
                }];
        }
        return [2 /*return*/];
    });
}); });
// Tool: retrieve_memory
server.registerTool("retrieve_memory", {
    description: "Retrieve a memory by its key",
    inputSchema: zod_1.z.object({
        key: zod_1.z.string().describe("Unique identifier for the memory to retrieve"),
    }),
    outputSchema: memoryResponseSchema,
}, function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var key, row;
    return __generator(this, function (_a) {
        key = args.key;
        try {
            row = stmtSelect.get(key);
            if (!row) {
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: false,
                                    message: "Memory not found: ".concat(key),
                                }),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/, {
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
                }];
        }
        catch (error) {
            return [2 /*return*/, {
                    content: [
                        {
                            type: "text",
                            text: "Error retrieving memory: ".concat(error instanceof Error ? error.message : String(error)),
                        },
                    ],
                    isError: true,
                }];
        }
        return [2 /*return*/];
    });
}); });
// Tool: list_memories
server.registerTool("list_memories", {
    description: "List all memories in the database, optionally limited",
    inputSchema: zod_1.z.object({
        limit: zod_1.z.number().int().positive().optional().describe("Maximum number of memories to return"),
    }),
    outputSchema: listResponseSchema,
}, function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, rows, memories;
    return __generator(this, function (_a) {
        limit = args.limit;
        try {
            rows = void 0;
            if (limit) {
                rows = db.prepare("\n          SELECT key, value, metadata, created_at, updated_at\n          FROM memories\n          ORDER BY updated_at DESC\n          LIMIT ?\n        ").all(limit);
            }
            else {
                rows = stmtSelectAll.all();
            }
            memories = rows.map(function (row) { return ({
                key: row.key,
                value: row.value,
                metadata: row.metadata ? JSON.parse(row.metadata) : null,
                created_at: row.created_at,
                updated_at: row.updated_at,
            }); });
            return [2 /*return*/, {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                count: memories.length,
                                memories: memories,
                            }),
                        },
                    ],
                }];
        }
        catch (error) {
            return [2 /*return*/, {
                    content: [
                        {
                            type: "text",
                            text: "Error listing memories: ".concat(error instanceof Error ? error.message : String(error)),
                        },
                    ],
                    isError: true,
                }];
        }
        return [2 /*return*/];
    });
}); });
// Tool: delete_memory
server.registerTool("delete_memory", {
    description: "Delete a memory by its key",
    inputSchema: zod_1.z.object({
        key: zod_1.z.string().describe("Unique identifier for the memory to delete"),
    }),
    outputSchema: zod_1.z.object({
        success: zod_1.z.boolean(),
        message: zod_1.z.string(),
        key: zod_1.z.string(),
    }),
}, function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var key, info;
    return __generator(this, function (_a) {
        key = args.key;
        try {
            info = stmtDelete.run(key);
            if (info.changes === 0) {
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: false,
                                    message: "Memory not found: ".concat(key),
                                }),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/, {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                message: "Memory deleted successfully",
                                key: key,
                            }),
                        },
                    ],
                }];
        }
        catch (error) {
            return [2 /*return*/, {
                    content: [
                        {
                            type: "text",
                            text: "Error deleting memory: ".concat(error instanceof Error ? error.message : String(error)),
                        },
                    ],
                    isError: true,
                }];
        }
        return [2 /*return*/];
    });
}); });
// Start server
var transport = new stdio_js_1.StdioServerTransport();
await server.connect(transport);
console.error("Memory MCP server running (DB: ".concat(DB_PATH, ")"));

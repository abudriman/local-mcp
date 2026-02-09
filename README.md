# Memory MCP Server

A lightweight MCP (Model Context Protocol) server for persistent agent memory using SQLite and Bun.

## Features

- **store_memory**: Store key-value pairs with optional JSON metadata
- **retrieve_memory**: Retrieve a memory by its key
- **list_memories**: List all memories with optional limit
- **delete_memory**: Delete a memory by its key

## Prerequisites

- [Bun](https://bun.sh) v1.3.9 or higher

## Installation

```bash
bun install
```

## Build

```bash
bun build src/index.ts --outdir=build --target=bun
```

## Run

```bash
bun run src/index.ts
```

Or use the built version:

```bash
bun run build/index.js
```

## Configuration

### Environment Variables

- `MEMORY_DB_PATH`: Path to the SQLite database file (default: `./memory.db`)

### MCP Settings Integration

To use this MCP server with Roo Code or Claude Desktop, add the following configuration to your MCP settings file:

**Roo Code** (Windows): `%APPDATA%\roo-code\settings\mcp_settings.json`
**Claude Desktop** (Windows): `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "memory": {
      "command": "bun",
      "args": ["/path/to/local-mcp/build/index.js"],
      "env": {
        "MEMORY_DB_PATH": "/path/to/local-mcp/memory.db"
      }
    }
  }
}
```

Replace `/path/to/local-mcp` with the absolute path to this directory.

## Usage Examples

Once configured, you can use the memory tools in your MCP client:

### Store a memory
```
store_memory with key="user_preference", value="dark_mode", metadata='{"category":"ui"}'
```

### Retrieve a memory
```
retrieve_memory with key="user_preference"
```

### List all memories
```
list_memories
```

### List limited memories
```
list_memories with limit=10
```

### Delete a memory
```
delete_memory with key="user_preference"
```

## Project Structure

```
local-mcp/
├── src/
│   ├── db/
│   │   └── index.ts          # Database initialization and types
│   ├── tools/
│   │   ├── store-memory/     # Store memory tool
│   │   ├── retrieve-memory/  # Retrieve memory tool
│   │   ├── list-memories/    # List memories tool
│   │   └── delete-memory/    # Delete memory tool
│   └── index.ts              # Main server entry point
├── build/                    # Compiled output
├── memory.db                 # SQLite database (created automatically)
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

```sql
CREATE TABLE memories (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## License

MIT

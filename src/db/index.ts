import { Database } from "bun:sqlite";

const DB_PATH = process.env.MEMORY_DB_PATH || "./memory.db";
export const db = new Database(DB_PATH);

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

export type MemoryRow = {
    key: string;
    value: string;
    metadata: string | null;
    created_at: string;
    updated_at: string;
};

export type Memory = {
    key: string;
    value: string;
    metadata: any | null;
    created_at: string;
    updated_at: string;
};

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DATA_DIR is set by Railway when a Volume is mounted (e.g. /app/data).
// Falls back to ../data for local development.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'kitchen.db');

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });
console.log(`📦 SQLite database path: ${DB_PATH}`);

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'chef',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '',
    unit TEXT NOT NULL DEFAULT 'kg',
    category TEXT NOT NULL DEFAULT '',
    subcategory TEXT,
    reference_price REAL,
    supplier TEXT,
    quick_quantities TEXT NOT NULL DEFAULT '[]',
    last_ordered_quantity REAL,
    last_order_date TEXT,
    order_frequency_days INTEGER,
    next_reminder TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_date TEXT NOT NULL,
    total_cost_k REAL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    subcategory TEXT,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    cost_k REAL,
    reference_price REAL,
    supplier TEXT,
    emoji TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stock_reports (
    id TEXT PRIMARY KEY,
    ingredient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    subcategory TEXT,
    unit TEXT NOT NULL,
    reported_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS stock_remaining (
    id TEXT PRIMARY KEY,
    ingredient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    subcategory TEXT,
    unit TEXT NOT NULL,
    remaining_quantity REAL NOT NULL,
    reported_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS daily_menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_date TEXT NOT NULL,
    branch_id TEXT NOT NULL DEFAULT 'pnt',
    dishes TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(menu_date, branch_id)
  );

  CREATE TABLE IF NOT EXISTS menu_dishes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    space_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    note TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  CREATE INDEX IF NOT EXISTS idx_order_items_ingredient ON order_items(ingredient_id);
  CREATE INDEX IF NOT EXISTS idx_stock_reports_ingredient ON stock_reports(ingredient_id);
  CREATE INDEX IF NOT EXISTS idx_stock_remaining_ingredient ON stock_remaining(ingredient_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_space ON inventory(space_id);
`);

export default db;

const path = require("node:path");
const fs = require("node:fs");
const Database = require("better-sqlite3");

require("dotenv").config();

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/studio.db";

// Ensure the parent directory exists before better-sqlite3 tries to open the file.
const dataDir = path.dirname(DATABASE_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DATABASE_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source      TEXT NOT NULL,
    content     TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS variants (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id     INTEGER NOT NULL REFERENCES posts(id),
    platform    TEXT NOT NULL CHECK (platform IN ('x', 'instagram', 'discord', 'telegram')),
    content     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'approved', 'rejected', 'published')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS slots (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id    INTEGER NOT NULL REFERENCES variants(id),
    scheduled_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS publish_attempts (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id           INTEGER NOT NULL REFERENCES slots(id),
    idempotency_key   TEXT NOT NULL UNIQUE,
    status            TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    external_ref      TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id     INTEGER NOT NULL REFERENCES slots(id),
    status      TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'claimed', 'done', 'failed')),
    claimed_at  TEXT
  );
`);

module.exports = db;
import {mkdirSync} from "node:fs";
import {dirname} from "node:path";
import {DatabaseSync} from "node:sqlite";
export function openMemory(path: string): DatabaseSync {
  mkdirSync(dirname(path), {recursive: true, mode: 0o700});
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS documents(id INTEGER PRIMARY KEY, source TEXT, path TEXT UNIQUE, commit_hash TEXT, sha256 TEXT, imported_at TEXT, classification TEXT, permission TEXT);
    CREATE TABLE IF NOT EXISTS chunks(id INTEGER PRIMARY KEY, document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE, section TEXT, content TEXT, sha256 TEXT);
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(content, section, content='chunks', content_rowid='id');
    CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN INSERT INTO chunks_fts(rowid, content, section) VALUES(new.id,new.content,new.section); END;
    CREATE TABLE IF NOT EXISTS citations(id INTEGER PRIMARY KEY, chunk_id INTEGER, used_at TEXT, purpose TEXT);
    CREATE TABLE IF NOT EXISTS decisions(id INTEGER PRIMARY KEY, created_at TEXT, summary TEXT, approved INTEGER);
    CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, created_at TEXT, status TEXT, summary TEXT);
    CREATE TABLE IF NOT EXISTS checkpoints(id INTEGER PRIMARY KEY, created_at TEXT, state TEXT, next_step TEXT);
    CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY, created_at TEXT, title TEXT, status TEXT, classification TEXT);
    CREATE TABLE IF NOT EXISTS evidence_index(id TEXT PRIMARY KEY, case_id TEXT, sha256 TEXT, size INTEGER, acquired_at TEXT);
    CREATE TABLE IF NOT EXISTS audit_events(id TEXT PRIMARY KEY, created_at TEXT, action TEXT, classification TEXT, status TEXT, duration_ms INTEGER);`);
  return db;
}

import type {DatabaseSync} from "node:sqlite";
export type SearchHit = {path: string; section: string; excerpt: string; score: number};
export function searchKnowledge(db: DatabaseSync, query: string, limit = 5): SearchHit[] {
  const safe = query.normalize("NFC").replace(/[^\p{L}\p{N}\s_-]/gu, " ").trim();
  if (!safe) return [];
  return db.prepare(`SELECT d.path, c.section, snippet(chunks_fts,0,'[',']','…',20) excerpt, bm25(chunks_fts) score
    FROM chunks_fts JOIN chunks c ON c.id=chunks_fts.rowid JOIN documents d ON d.id=c.document_id
    WHERE chunks_fts MATCH ? ORDER BY score LIMIT ?`).all(safe, Math.min(limit, 10)) as SearchHit[];
}

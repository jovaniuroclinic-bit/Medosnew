import type {SearchHit} from "./search.js";
export function formatCitation(hit: SearchHit): string { return `[${hit.path} — ${hit.section}]`; }

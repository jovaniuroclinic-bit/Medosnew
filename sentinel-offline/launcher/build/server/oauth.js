import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
const flows = new Map();
export function beginOAuth(redirectUri) { const id = randomBytes(16).toString("hex"), state = randomBytes(32).toString("base64url"), nonce = randomBytes(32).toString("base64url"), verifier = randomBytes(48).toString("base64url"); flows.set(id, { state, nonce, verifier, redirectUri, expires: Date.now() + 300_000, used: false }); return { id, state, nonce, challenge: createHash("sha256").update(verifier).digest("base64url"), redirectUri }; }
export function consumeOAuth(id, state, redirectUri) { const f = flows.get(id); if (!f || f.used || f.expires < Date.now() || f.redirectUri !== redirectUri)
    throw new Error("OAUTH_REJECTED"); const a = Buffer.from(f.state), b = Buffer.from(state); if (a.length !== b.length || !timingSafeEqual(a, b))
    throw new Error("OAUTH_REJECTED"); f.used = true; return { verifier: f.verifier, nonce: f.nonce }; }

import { randomBytes } from "node:crypto";
export function newSession(csrf, ttlMs = 10 * 60_000) { return { id: randomBytes(32).toString("base64url"), csrf, expires: Date.now() + ttlMs }; }
export const sessionValid = (s) => Boolean(s && s.expires > Date.now());
export const requireReauth = (s) => Boolean(sessionValid(s) && s?.reauthenticatedAt && Date.now() - s.reauthenticatedAt < 120_000);

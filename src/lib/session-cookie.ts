// Shared by proxy.ts and the auth code. Keep free of server-only imports.
export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5; // 5 days

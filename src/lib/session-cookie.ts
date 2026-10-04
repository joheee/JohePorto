// Shared by proxy.ts and the auth code. Keep free of server-only imports.
export const SESSION_COOKIE = "admin_session";
// Absolute limit from sign-in (it does not extend while you are active). Firebase signs this expiry into
// the cookie, so the server enforces it too, not just the browser. Allowed range: 5 minutes to 2 weeks.
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 3; // 3 hours

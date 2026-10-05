// The contact form shown as an API request (see ContactForm.tsx): what the body is, how it is checked
// before sending (lint-style), a curl line for it, and how a response is described. Pure and tested.
export type ContactValues = { name: string; email: string; text: string };

export const LIMITS = { name: 100, email: 200, text: 5000 } as const;

// The same rules as /api/contact, so a request that would be refused is caught before it is sent.
export function lintContact(v: ContactValues): Partial<Record<keyof ContactValues, string>> {
  const errors: Partial<Record<keyof ContactValues, string>> = {};
  const name = v.name.trim();
  const email = v.email.trim();
  const text = v.text.trim();
  if (!name) errors.name = "required";
  else if (name.length > LIMITS.name) errors.name = `too long (${name.length} > ${LIMITS.name} characters)`;
  if (!email) errors.email = "required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "must be a valid address, like name@domain.tld";
  else if (email.length > LIMITS.email) errors.email = `too long (${email.length} > ${LIMITS.email} characters)`;
  if (!text) errors.text = "required";
  else if (text.length > LIMITS.text) errors.text = `too long (${text.length} > ${LIMITS.text} characters)`;
  return errors;
}

// The JSON that is sent (without the hidden honeypot field).
export const requestBody = (v: ContactValues): ContactValues => ({ name: v.name.trim(), email: v.email.trim(), text: v.text.trim() });

// A JSON string literal for the preview. A long message is cut so the preview stays short; the request itself
// always carries the whole text.
export function previewValue(value: string, max = 140): string {
  const cut = value.length > max ? `${value.slice(0, max)}…` : value;
  return JSON.stringify(cut);
}

// POSIX shell quoting: wrap in single quotes, and write each ' as '\''.
const sh = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

export function curlCommand(origin: string, v: ContactValues): string {
  return `curl -X POST ${sh(`${origin}/api/contact`)} -H 'Content-Type: application/json' -d ${sh(JSON.stringify(requestBody(v)))}`;
}

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  400: "Bad Request",
  413: "Payload Too Large",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};
export const statusText = (status: number) => STATUS_TEXT[status] ?? "";

export function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

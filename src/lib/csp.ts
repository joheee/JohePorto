// The Content-Security-Policy for pages. Built per request in proxy.ts with a fresh nonce: scripts
// run only if they carry that nonce (Next adds it to its own scripts), so injected inline scripts are
// refused. Inline style *attributes* (motion, the hero) cannot take a nonce, hence style-src-attr.
export function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Dev: Turbopack injects un-nonced <style> tags for hot reload. Production has none.
    isDev ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // Dev: Turbopack's hot-reload socket.
    `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com${isDev ? " ws: http://localhost:*" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Would turn http://localhost subresources into https in dev.
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

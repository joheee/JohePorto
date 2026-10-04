import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy without nonces: nonces would make every page render on each request and
// drop the static/CDN-cached pages. 'unsafe-inline' is needed for Next's own inline bootstrap
// scripts, the theme script in layout.tsx and inline style attributes (motion, the hero). The rest is
// locked down: no third-party scripts/images/frames/fonts, connections only to this site and the
// Firebase Auth endpoints used by the login form.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
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

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Switches off powerful features this site never uses. Clipboard (copy email) stays allowed.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
        ],
      },
      {
        // Not on the PDF: a CSP on a PDF response can stop Chrome's built-in viewer from opening it.
        source: "/((?!resume\\.pdf).*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default nextConfig;

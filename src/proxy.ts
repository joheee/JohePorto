import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// 1) Admin: optimistic pre-filter only, sends cookie-less visitors to the login page. The real check
//    happens in getAdmin()/requireAdmin() next to the data.
// 2) Every page: a fresh CSP nonce (see lib/csp.ts). Reading it in the root layout is what makes pages
//    render per request instead of being static.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  // Next reads the nonce from the request's CSP header while rendering; the layout reads x-nonce.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: not API routes, build assets, or the generated files (PDF, icons, sitemap...).
      source: "/((?!api|_next/static|_next/image|resume\\.pdf|robots\\.txt|sitemap\\.xml|favicon\\.ico|icon|apple-icon|opengraph-image|twitter-image).*)",
      // Link prefetches don't render a page the browser runs.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

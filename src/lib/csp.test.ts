import { describe, expect, it } from "vitest";
import { buildCsp } from "./csp";

const directive = (csp: string, name: string) => csp.split("; ").find((d) => d === name || d.startsWith(`${name} `));

describe("buildCsp (production)", () => {
  const csp = buildCsp("abc123", false);

  it("only runs scripts that carry the nonce, and never allows inline or eval", () => {
    expect(directive(csp, "script-src")).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe/);
  });
  it("allows inline styles only through the nonce, plus style attributes", () => {
    expect(directive(csp, "style-src")).toBe("style-src 'self' 'nonce-abc123'");
    expect(directive(csp, "style-src-attr")).toBe("style-src-attr 'unsafe-inline'");
  });
  it("locks down objects, base, forms and framing, and upgrades insecure requests", () => {
    for (const d of ["object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "default-src 'self'", "upgrade-insecure-requests"]) {
      expect(csp.split("; ")).toContain(d);
    }
  });
  it("only lets pages call Firebase Auth besides itself, with no websockets", () => {
    const connect = directive(csp, "connect-src")!;
    expect(connect).toContain("https://identitytoolkit.googleapis.com");
    expect(connect).not.toMatch(/ws:|localhost/);
  });
  it("uses a different nonce each time it is built with one", () => {
    expect(buildCsp("other", false)).toContain("'nonce-other'");
  });
});

describe("buildCsp (development)", () => {
  const csp = buildCsp("abc123", true);
  it("allows what hot reload needs, and does not upgrade requests", () => {
    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
    expect(directive(csp, "style-src")).toContain("'unsafe-inline'");
    expect(directive(csp, "connect-src")).toMatch(/ws: http:\/\/localhost:\*/);
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});

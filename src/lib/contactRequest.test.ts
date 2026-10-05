import { describe, expect, it } from "vitest";
import { curlCommand, formatBytes, lintContact, previewValue, requestBody, statusText } from "./contactRequest";

const ok = { name: "Jo", email: "jo@example.com", text: "Hello" };

describe("lintContact", () => {
  it("finds nothing wrong with a valid request", () => {
    expect(lintContact(ok)).toEqual({});
  });
  it("asks for every missing field, treating spaces as empty", () => {
    expect(lintContact({ name: " ", email: "", text: "\n" })).toEqual({
      name: "required",
      email: "required",
      text: "required",
    });
  });
  it("rejects an email the server would refuse", () => {
    expect(lintContact({ ...ok, email: "jo@example" }).email).toMatch(/valid address/);
    expect(lintContact({ ...ok, email: "jo example.com" }).email).toMatch(/valid address/);
  });
  it("rejects values over the limits and says by how much", () => {
    expect(lintContact({ ...ok, name: "x".repeat(101) }).name).toBe("too long (101 > 100 characters)");
    expect(lintContact({ ...ok, text: "x".repeat(5001) }).text).toBe("too long (5001 > 5000 characters)");
    expect(lintContact({ ...ok, email: `${"x".repeat(195)}@a.com` }).email).toMatch(/too long/);
  });
  it("accepts values right at the limits", () => {
    expect(lintContact({ name: "x".repeat(100), email: "jo@example.com", text: "x".repeat(5000) })).toEqual({});
  });
});

describe("requestBody", () => {
  it("trims the values and sends only the three fields", () => {
    expect(requestBody({ name: "  Jo ", email: " jo@example.com ", text: "\nHi\n" })).toEqual({ name: "Jo", email: "jo@example.com", text: "Hi" });
  });
});

describe("previewValue", () => {
  it("shows a JSON string, escaping what JSON escapes", () => {
    expect(previewValue('say "hi"\nbye')).toBe('"say \\"hi\\"\\nbye"');
  });
  it("cuts a long value and marks the cut", () => {
    expect(previewValue("x".repeat(200), 10)).toBe('"xxxxxxxxxx…"');
    expect(previewValue("short", 10)).toBe('"short"');
  });
});

describe("curlCommand", () => {
  it("builds a curl command for the real endpoint", () => {
    expect(curlCommand("https://www.johe.my.id", ok)).toBe(
      `curl -X POST 'https://www.johe.my.id/api/contact' -H 'Content-Type: application/json' -d '{"name":"Jo","email":"jo@example.com","text":"Hello"}'`,
    );
  });
  it("quotes single quotes so the command cannot be broken out of", () => {
    const cmd = curlCommand("https://x.dev", { ...ok, text: "it's $(rm -rf ~)" });
    expect(cmd).toContain(`"text":"it'\\''s $(rm -rf ~)"`);
    expect(cmd.endsWith(`}'`)).toBe(true);
  });
});

describe("statusText and formatBytes", () => {
  it("names the status codes the API can return", () => {
    expect(statusText(200)).toBe("OK");
    expect(statusText(400)).toBe("Bad Request");
    expect(statusText(418)).toBe("");
  });
  it("formats sizes", () => {
    expect(formatBytes(11)).toBe("11 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
  });
});

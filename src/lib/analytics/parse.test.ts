import { describe, expect, it } from "vitest";
import { browserOf, cleanToken, countryOf, dayKey, deviceOf, isBot, languageOf, mapKey, referrerHost, validateBeacon, visitorHash } from "./parse";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const EDGE = `${CHROME} Edg/126.0.0.0`;
const FIREFOX = "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0";
const SAFARI_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const CHROME_ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

describe("isBot", () => {
  it("lets real browsers through", () => {
    for (const ua of [CHROME, EDGE, FIREFOX, SAFARI_IPHONE, CHROME_ANDROID]) expect(isBot(ua)).toBe(false);
  });
  it("recognises crawlers, monitors, link previews, scripts and test tools", () => {
    for (const ua of ["Googlebot/2.1 (+http://www.google.com/bot.html)", "Mozilla/5.0 (compatible; bingbot/2.0)", "facebookexternalhit/1.1", "curl/8.4.0", "python-requests/2.31", "Mozilla/5.0 HeadlessChrome/126.0", "Mozilla/5.0 Chrome-Lighthouse", "UptimeRobot/2.0", "Slackbot-LinkExpanding 1.0"]) {
      expect(isBot(ua)).toBe(true);
    }
  });
  it("treats a request with no user agent as a bot", () => {
    expect(isBot("")).toBe(true);
    expect(isBot("   ")).toBe(true);
  });
});

describe("deviceOf", () => {
  it("tells phones, tablets and desktops apart", () => {
    expect(deviceOf(SAFARI_IPHONE)).toBe("phone");
    expect(deviceOf(CHROME_ANDROID)).toBe("phone");
    expect(deviceOf(IPAD)).toBe("tablet");
    expect(deviceOf("Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/126 Safari/537.36")).toBe("tablet"); // Android without "Mobile"
    expect(deviceOf(CHROME)).toBe("desktop");
  });
});

describe("browserOf", () => {
  it("names the browser, with Edge and Opera before Chrome and Chrome before Safari", () => {
    expect(browserOf(EDGE)).toBe("edge");
    expect(browserOf(CHROME)).toBe("chrome");
    expect(browserOf(CHROME_ANDROID)).toBe("chrome");
    expect(browserOf(FIREFOX)).toBe("firefox");
    expect(browserOf(SAFARI_IPHONE)).toBe("safari");
    expect(browserOf(`${CHROME} OPR/110.0`)).toBe("opera");
    expect(browserOf("SamsungBrowser/24.0 Chrome/117")).toBe("samsung");
    expect(browserOf("something else")).toBe("other");
  });
});

describe("cleanToken", () => {
  it("lower-cases and keeps only letters, digits . _ -", () => {
    expect(cleanToken("LinkedIn CV!")).toBe("linkedin-cv");
    expect(cleanToken("  --Spring_2026--  ")).toBe("spring_2026");
  });
  it("cuts long values, and returns nothing for non-text", () => {
    expect(cleanToken("x".repeat(100), 10)).toBe("xxxxxxxxxx");
    expect(cleanToken(42)).toBe("");
    expect(cleanToken(undefined)).toBe("");
  });
});

describe("referrerHost", () => {
  it("is the site the visitor came from, without www", () => {
    expect(referrerHost("https://www.linkedin.com/in/jo/", "www.johe.my.id")).toBe("linkedin.com");
    expect(referrerHost("https://www.google.com/search?q=x", "johe.my.id")).toBe("google.com");
  });
  it("is direct without a referrer, for an unreadable one, and for this very site", () => {
    expect(referrerHost("", "johe.my.id")).toBe("direct");
    expect(referrerHost("not a url", "johe.my.id")).toBe("direct");
    expect(referrerHost("https://www.johe.my.id/#about", "johe.my.id")).toBe("direct");
    expect(referrerHost("http://localhost:3000/", "localhost:3000")).toBe("direct");
  });
  it("names shortened links and app referrers by the site behind them", () => {
    expect(referrerHost("https://lnkd.in/abc", "johe.my.id")).toBe("linkedin.com");
    expect(referrerHost("https://t.co/xyz", "johe.my.id")).toBe("x.com");
    expect(referrerHost("android-app://com.linkedin.android", "johe.my.id")).toBe("linkedin.com");
  });
});

describe("languageOf and countryOf", () => {
  it("uses the main language, and xx when unknown", () => {
    expect(languageOf("id-ID,id;q=0.9,en;q=0.8")).toBe("id");
    expect(languageOf("en")).toBe("en");
    expect(languageOf(null)).toBe("xx");
    expect(languageOf("*")).toBe("xx");
  });
  it("takes a two-letter country in capitals, and xx when unknown", () => {
    expect(countryOf("id")).toBe("ID");
    expect(countryOf("ID")).toBe("ID");
    expect(countryOf(null)).toBe("xx");
    expect(countryOf("IDN")).toBe("xx");
  });
});

describe("dayKey", () => {
  const t = new Date("2026-10-05T20:00:00Z");
  it("is the date in UTC by default", () => {
    expect(dayKey(t)).toBe("2026-10-05");
  });
  it("follows the time zone you read your numbers in", () => {
    expect(dayKey(t, "Asia/Jakarta")).toBe("2026-10-06"); // 03:00 the next morning there
  });
  it("falls back to UTC for a time zone it does not know", () => {
    expect(dayKey(t, "Not/AZone")).toBe("2026-10-05");
  });
});

describe("visitorHash", () => {
  it("is the same for the same visitor on the same day, and different on another day or for another visitor", () => {
    const a = visitorHash("2026-10-05", "1.2.3.4", CHROME, "salt");
    expect(visitorHash("2026-10-05", "1.2.3.4", CHROME, "salt")).toBe(a);
    expect(visitorHash("2026-10-06", "1.2.3.4", CHROME, "salt")).not.toBe(a);
    expect(visitorHash("2026-10-05", "1.2.3.5", CHROME, "salt")).not.toBe(a);
    expect(visitorHash("2026-10-05", "1.2.3.4", FIREFOX, "salt")).not.toBe(a);
    expect(visitorHash("2026-10-05", "1.2.3.4", CHROME, "other")).not.toBe(a);
  });
  it("is short, safe text that does not contain the address", () => {
    const h = visitorHash("2026-10-05", "1.2.3.4", CHROME, "salt");
    expect(h).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(h).not.toContain("1.2.3.4");
  });
});

describe("mapKey", () => {
  it("makes a safe Firestore map key", () => {
    expect(mapKey("LinkedIn.com")).toBe("linkedin.com");
    expect(mapKey("a/b c")).toBe("a_b_c");
    expect(mapKey("")).toBe("_");
    expect(mapKey("x".repeat(100))).toHaveLength(60);
  });
});

describe("validateBeacon", () => {
  it("accepts a view and cleans its text", () => {
    expect(validateBeacon({ kind: "view", ref: "https://www.linkedin.com/", utm: { source: "LinkedIn CV", medium: "", campaign: "x" }, theme: "light", width: 390.4 })).toEqual({
      kind: "view",
      ref: "https://www.linkedin.com/",
      utm: { source: "linkedin-cv", medium: "", campaign: "x" },
      theme: "light",
      width: 390,
    });
  });
  it("falls back to safe defaults for a sloppy view", () => {
    expect(validateBeacon({ kind: "view", ref: 5, theme: "purple", width: "wide" })).toEqual({ kind: "view", ref: "", utm: { source: "", medium: "", campaign: "" }, theme: "dark", width: 0 });
  });
  it("cuts a very long referrer", () => {
    expect((validateBeacon({ kind: "view", ref: "x".repeat(900) }) as { ref: string }).ref).toHaveLength(500);
  });
  it("accepts an end with known sections and events only, each section once", () => {
    expect(
      validateBeacon({ kind: "end", sections: ["hero", "projects", "projects", "nope", 3], events: ["resume", "project.aws-base", "project.Bad Slug", "hack", "contact.sent", 7] }),
    ).toEqual({ kind: "end", sections: ["hero", "projects"], events: ["resume", "project.aws-base", "contact.sent"] });
  });
  it("limits how many events one beacon can carry", () => {
    const b = validateBeacon({ kind: "end", sections: [], events: Array(100).fill("resume") }) as { events: string[] };
    expect(b.events).toHaveLength(40);
  });
  it("drops anything that is not a view or an end", () => {
    for (const bad of [null, undefined, 5, "view", [], {}, { kind: "other" }, { kind: 1 }]) expect(validateBeacon(bad)).toBeNull();
  });
});

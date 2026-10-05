// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { takeEvents, track } from "@/lib/track";
import Analytics from "./Analytics";

const beacons: Record<string, unknown>[] = [];
let reveal: (id: string) => void = () => {};

async function readBlob(b: Blob): Promise<Record<string, unknown>> {
  return JSON.parse(await b.text());
}

beforeEach(() => {
  beacons.length = 0;
  takeEvents();
  document.body.innerHTML = `
    <section id="hero"></section><section id="about"></section><section id="projects"><article data-project="aws-base"><a id="repo" href="https://github.com/joheee/AwsBaseInfra">repo</a></article></section>
    <section id="reviews"><a id="rev" href="https://www.linkedin.com/in/jane/">view</a></section>
    <section id="contact"><a id="gh" href="https://github.com/joheee">GitHub</a><a id="cv" href="/resume.pdf">cv</a><a id="in" href="/#about">in</a></section>`;
  document.documentElement.dataset.theme = "light";
  vi.stubGlobal("requestIdleCallback", (cb: () => void) => { cb(); return 1; });
  vi.stubGlobal("cancelIdleCallback", () => {});
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (e: { isIntersecting: boolean; target: Element }[]) => void) {
        reveal = (id) => cb([{ isIntersecting: true, target: document.getElementById(id)! }]);
      }
      observe() {}
      disconnect() {}
    },
  );
  Object.defineProperty(navigator, "sendBeacon", { value: vi.fn((_url: string, blob: Blob) => { void readBlob(blob).then((b) => beacons.push(b)); return true; }), configurable: true });
  Object.defineProperty(navigator, "doNotTrack", { value: null, configurable: true });
  Object.defineProperty(navigator, "globalPrivacyControl", { value: false, configurable: true });
  window.history.replaceState({}, "", "/?utm_source=linkedin-cv&utm_medium=social");
});
afterEach(() => vi.unstubAllGlobals());

const flushed = () => new Promise((r) => setTimeout(r, 0));
const leave = () => {
  Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("Analytics", () => {
  it("reports the visit once the page has settled: referrer, campaign, theme and width, nothing personal", async () => {
    render(<Analytics />);
    await flushed();
    expect(beacons).toEqual([
      { kind: "view", ref: "", utm: { source: "linkedin-cv", medium: "social", campaign: null }, theme: "light", width: window.innerWidth },
    ]);
    expect(navigator.sendBeacon).toHaveBeenCalledWith("/api/collect", expect.any(Blob));
  });

  it("does nothing for someone who asked not to be tracked", async () => {
    Object.defineProperty(navigator, "doNotTrack", { value: "1", configurable: true });
    render(<Analytics />);
    await flushed();
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
    Object.defineProperty(navigator, "doNotTrack", { value: null, configurable: true });
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true });
    render(<Analytics />);
    await flushed();
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("reports the sections reached, and the links used, when the visitor leaves", async () => {
    render(<Analytics />);
    await flushed();
    beacons.length = 0;
    act_reveal(["hero", "about", "projects"]);
    document.getElementById("gh")!.click();
    document.getElementById("cv")!.click();
    track("copy.email");
    leave();
    await flushed();
    expect(beacons).toEqual([{ kind: "end", sections: ["hero", "about", "projects"], events: ["social.github", "resume", "copy.email"] }]);
  });

  it("counts a click in a project card for that project, ignores review links and links inside the site", async () => {
    render(<Analytics />);
    await flushed();
    beacons.length = 0;
    document.getElementById("repo")!.click();
    document.getElementById("rev")!.click();
    document.getElementById("in")!.click();
    leave();
    await flushed();
    expect(beacons).toEqual([{ kind: "end", sections: [], events: ["project.aws-base"] }]);
  });

  it("sends only what is new when the tab is hidden again, so nothing is counted twice", async () => {
    render(<Analytics />);
    await flushed();
    beacons.length = 0;
    act_reveal(["hero"]);
    leave();
    leave(); // hidden again without anything new
    act_reveal(["hero", "about"]);
    leave();
    await flushed();
    expect(beacons).toEqual([
      { kind: "end", sections: ["hero"], events: [] },
      { kind: "end", sections: ["about"], events: [] },
    ]);
  });

  it("sends nothing when there is nothing to report", async () => {
    render(<Analytics />);
    await flushed();
    beacons.length = 0;
    leave();
    await flushed();
    expect(beacons).toEqual([]);
  });

  it("stops listening when it is removed", async () => {
    const { unmount } = render(<Analytics />);
    await flushed();
    unmount();
    beacons.length = 0;
    document.getElementById("cv")!.click();
    leave();
    await flushed();
    expect(beacons).toEqual([]);
    expect(takeEvents()).toEqual([]);
  });
});

function act_reveal(ids: string[]) {
  ids.forEach((id) => reveal(id));
}

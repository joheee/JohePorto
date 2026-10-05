import { describe, expect, it } from "vitest";
import { takeEvents, track } from "./track";

describe("track", () => {
  it("collects events in order and hands them over once", () => {
    takeEvents();
    track("resume");
    track("copy.email");
    expect(takeEvents()).toEqual(["resume", "copy.email"]);
    expect(takeEvents()).toEqual([]);
  });

  it("stops queueing at a limit, so a page left open cannot grow it for ever", () => {
    takeEvents();
    for (let i = 0; i < 100; i++) track("resume");
    expect(takeEvents()).toHaveLength(40);
  });
});

// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AutoTextarea from "./AutoTextarea";

// jsdom does no layout: the box's width and the text's height are set by hand, like a browser would report them.
let width = 0;
let scrollHeight = 0;
let notify: () => void = () => {};
const disconnect = vi.fn();

beforeEach(() => {
  width = 0;
  scrollHeight = 0;
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(() => scrollHeight);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(cb: () => void) {
        notify = cb;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

const box = () => screen.getByRole("textbox") as HTMLTextAreaElement;

describe("AutoTextarea", () => {
  it("fits its content when mounted visible", () => {
    width = 400;
    scrollHeight = 72;
    render(<AutoTextarea value="hello" onChange={() => {}} />);
    expect(box().style.height).toBe("72px");
  });

  // Regression: mounted inside the closed <dialog> of the site editor (display: none, so width and
  // scrollHeight read 0), the box collapsed to 0px and stayed that way until you typed in it.
  it("re-measures when it becomes visible after being mounted hidden", () => {
    render(<AutoTextarea value="a long pitch that wraps" onChange={() => {}} />);
    expect(box().style.height).toBe("0px"); // measured while hidden
    width = 500; // the dialog opens
    scrollHeight = 72;
    notify();
    expect(box().style.height).toBe("72px");
  });

  it("re-measures when the width changes (the text wraps differently)", () => {
    width = 500;
    scrollHeight = 40;
    render(<AutoTextarea value="text" onChange={() => {}} />);
    width = 250;
    scrollHeight = 80;
    notify();
    expect(box().style.height).toBe("80px");
  });

  it("ignores size notifications that are only its own height change", () => {
    width = 500;
    scrollHeight = 40;
    render(<AutoTextarea value="text" onChange={() => {}} />);
    scrollHeight = 999; // would be picked up by a needless re-measure
    notify();
    expect(box().style.height).toBe("40px");
  });

  it("grows as you type, and stops observing when removed", () => {
    width = 400;
    scrollHeight = 40;
    const { unmount } = render(<AutoTextarea defaultValue="" />);
    scrollHeight = 100;
    fireEvent.input(box());
    expect(box().style.height).toBe("100px");
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("caps the height at maxHeight and scrolls beyond it", () => {
    width = 400;
    scrollHeight = 500;
    render(<AutoTextarea value="x" onChange={() => {}} maxHeight={200} />);
    expect(box().style.height).toBe("200px");
    expect(box().style.overflowY).toBe("auto");
  });
});

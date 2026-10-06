// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NavPath from "./NavPath";

const pathname = vi.hoisted(() => ({ value: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

// A fake IntersectionObserver that lets the test say which section is in view.
let notify: (id: string) => void = () => {};
const observed: string[] = [];

beforeEach(() => {
  pathname.value = "/";
  observed.length = 0;
  for (const id of ["hero", "about", "projects", "experience", "reviews", "contact"]) {
    const el = document.createElement("section");
    el.id = id;
    document.body.appendChild(el);
  }
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entries: { isIntersecting: boolean; target: Element }[]) => void) {
        notify = (id) => cb([{ isIntersecting: true, target: document.getElementById(id)! }]);
      }
      observe(el: Element) {
        observed.push(el.id);
      }
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

const text = (c: HTMLElement) => c.querySelector("p")?.textContent;

describe("NavPath", () => {
  it("starts at the home directory, as the end of the prompt that the brand begins", () => {
    const { container } = render(<NavPath />);
    expect(text(container)).toBe(":~");
  });

  it("follows the section in view, and goes back to ~ at the top", () => {
    const { container } = render(<NavPath />);
    expect(observed).toEqual(["hero", "about", "projects", "experience", "reviews", "contact"]);
    act(() => notify("experience"));
    expect(text(container)).toBe(":~/experience");
    act(() => notify("contact"));
    expect(text(container)).toBe(":~/contact");
    act(() => notify("hero"));
    expect(text(container)).toBe(":~");
  });

  it("is decoration, hidden from screen readers, and shown on every screen size on the public page", () => {
    const { container } = render(<NavPath />);
    const p = container.querySelector("p")!;
    expect(p).toHaveAttribute("aria-hidden", "true");
    expect(p.className).not.toMatch(/\bhidden\b/); // on phones it is a second line under the brand
    expect(container.querySelector("span")!.className).toContain("max-md:hidden"); // the colon only belongs to the one-line version
  });

  it("follows the sections on /admin/site too, which has the same ones", () => {
    pathname.value = "/admin/site";
    const { container } = render(<NavPath />);
    expect(observed).toEqual(["hero", "about", "projects", "experience", "reviews", "contact"]);
    expect(text(container)).toBe(":~");
    act(() => notify("projects"));
    expect(text(container)).toBe(":~/projects");
  });

  it("shows the page you are on in the other admin pages, without watching any section", () => {
    pathname.value = "/admin/messages";
    const { container } = render(<NavPath />);
    expect(text(container)).toBe(":~/admin/messages");
    expect(observed).toEqual([]);
    pathname.value = "/admin";
    const again = render(<NavPath />);
    expect(text(again.container)).toBe(":~/admin");
  });

  it("in the admin, steps aside from lg up (the five tabs need the room) but shows below it", () => {
    pathname.value = "/admin/site";
    const cls = render(<NavPath />).container.querySelector("p")!.className.split(" ");
    expect(cls).toContain("lg:hidden");
    expect(cls).not.toContain("hidden");
  });

  it("on the public pages, is never hidden by width", () => {
    pathname.value = "/blog";
    expect(render(<NavPath />).container.querySelector("p")!.className).not.toContain("hidden");
  });

  it("continues the prompt on the blog pages", () => {
    pathname.value = "/blog";
    expect(text(render(<NavPath />).container)).toBe(":~/blog");
    pathname.value = "/blog/my-post";
    expect(text(render(<NavPath />).container)).toBe(":~/blog/my-post");
  });

  it("shows nothing on the login page or any other page", () => {
    pathname.value = "/admin/login";
    expect(render(<NavPath />).container).toBeEmptyDOMElement();
    pathname.value = "/not-found";
    expect(render(<NavPath />).container).toBeEmptyDOMElement();
    expect(observed).toEqual([]);
  });
});

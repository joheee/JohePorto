import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library only cleans up on its own when test globals are on; do it explicitly.
afterEach(() => cleanup());

// jsdom has no <dialog>.showModal()/close(): give it the minimum the app relies on (the `open` state).
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
}

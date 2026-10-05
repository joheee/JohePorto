// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "./ConfirmDialog";

function setup(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(<ConfirmDialog open title="Delete this?" description="It will be gone." onConfirm={onConfirm} onCancel={onCancel} {...props} />);
  return { onConfirm, onCancel, user: userEvent.setup() };
}

describe("ConfirmDialog", () => {
  it("shows the title, description and a custom confirm label only while open", () => {
    const { rerender } = render(<ConfirmDialog open={false} title="T" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<ConfirmDialog open title="T" description="D" confirmLabel="Remove" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "T" })).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("confirms and cancels with its buttons", async () => {
    const { user, onConfirm, onCancel } = setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("Escape and a click on the backdrop cancel", () => {
    const { onCancel } = setup();
    const dialog = screen.getByRole("dialog");
    fireEvent(dialog, new Event("cancel", { cancelable: true })); // what the browser sends on Escape
    fireEvent.click(dialog); // the backdrop is the dialog element itself
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("does nothing while busy", async () => {
    const { user, onCancel } = setup({ busy: true });
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    await user.click(screen.getByRole("dialog"));
    expect(onCancel).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("traps Tab focus within the dialog", async () => {
    const user = userEvent.setup();
    render(
      <Modal open onClose={vi.fn()} title="Test modal">
        <button>First</button>
        <button>Last</button>
      </Modal>
    );

    const closeButton = screen.getByRole("button", { name: /yopish/i });
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(closeButton);

    closeButton.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);

    first.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(closeButton);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Test modal">
        <p>Content</p>
      </Modal>
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

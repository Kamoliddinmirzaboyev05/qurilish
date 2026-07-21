import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState, ErrorState } from "./Card";

describe("EmptyState", () => {
  it("renders the given title", () => {
    render(<EmptyState title="Hozircha ochiq muammolar mavjud emas." />);
    expect(screen.getByText("Hozircha ochiq muammolar mavjud emas.")).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("renders a default message and calls onRetry when clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    expect(screen.getByText(/ma'lumotlarni yuklashda xatolik yuz berdi/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /qayta urinib ko'rish/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import RegisterPage from "./RegisterPage";

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: () => ({ user: null, isLoading: false, setUser: vi.fn(), refresh: vi.fn() }),
}));

describe("RegisterPage", () => {
  it("offers only Korxona and Olim role cards, never Administrator", () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByRole("button", { name: /korxona/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /olim/i })).toBeInTheDocument();
    expect(screen.queryByText(/administrator/i)).not.toBeInTheDocument();
  });

  it("shows scientist-only fields after selecting Olim", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    expect(screen.queryByLabelText(/mutaxassislik/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /olim/i }));

    expect(screen.getByLabelText(/mutaxassislik/i)).toBeInTheDocument();
    expect(screen.getByLabelText("F.I.Sh.", { exact: false })).toBeInTheDocument();
  });
});

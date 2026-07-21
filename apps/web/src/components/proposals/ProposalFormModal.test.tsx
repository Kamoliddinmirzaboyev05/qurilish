import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { ProposalFormModal } from "./ProposalFormModal";

describe("ProposalFormModal", () => {
  it("hides the price input when 'Narx kelishiladi' is checked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProposalFormModal open problemId="problem-1" onClose={vi.fn()} />);

    expect(screen.getByLabelText(/taklif narxi/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/narx kelishiladi/i));

    expect(screen.queryByLabelText(/taklif narxi/i)).not.toBeInTheDocument();
  });
});

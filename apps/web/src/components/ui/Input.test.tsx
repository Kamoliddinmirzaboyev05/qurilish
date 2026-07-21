import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhoneInput } from "./Input";

describe("PhoneInput", () => {
  it("auto-prefixes +998 and strips non-digit characters", async () => {
    const user = userEvent.setup();
    render(<PhoneInput aria-label="phone" />);
    const input = screen.getByLabelText("phone") as HTMLInputElement;

    await user.type(input, "90 111 22 33");

    expect(input.value).toBe("+998901112233");
  });

  it("strips a redundant leading 998 when a full number is pasted at once", async () => {
    const user = userEvent.setup();
    render(<PhoneInput aria-label="phone" />);
    const input = screen.getByLabelText("phone") as HTMLInputElement;

    await user.click(input);
    await user.paste("998901112233");

    expect(input.value).toBe("+998901112233");
  });
});

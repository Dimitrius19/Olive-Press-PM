import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PasswordGate } from "../../src/components/PasswordGate";

describe("PasswordGate", () => {
  it("renders password input and submit button", () => {
    render(<PasswordGate onAuthenticated={() => {}} />);

    expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter" })).toBeInTheDocument();
    expect(screen.getByText("Olive Press Hotel")).toBeInTheDocument();
  });

  it("calls onAuthenticated with the entered password on submit", () => {
    const handleAuth = vi.fn();
    render(<PasswordGate onAuthenticated={handleAuth} />);

    const input = screen.getByPlaceholderText("Enter password");
    fireEvent.change(input, { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Enter" }));

    expect(handleAuth).toHaveBeenCalledWith("secret123");
  });

  it("displays an error message when error prop is provided", () => {
    render(
      <PasswordGate
        onAuthenticated={() => {}}
        error="Invalid password"
      />,
    );

    expect(screen.getByText("Invalid password")).toBeInTheDocument();
  });
});

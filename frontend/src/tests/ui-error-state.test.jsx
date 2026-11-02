import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorState } from "../components/ui/ErrorState.jsx";

describe("ErrorState", () => {
  it("renders the message with the shared error styling", () => {
    render(<ErrorState message="Failed to fetch documents" />);
    const el = screen.getByText("Failed to fetch documents");
    expect(el.className).toContain("text-red-400");
    expect(el.className).toContain("text-center");
    expect(el.className).toContain("py-4");
  });

  it("appends className extras", () => {
    render(<ErrorState message="Boom" className="text-sm" />);
    const el = screen.getByText("Boom");
    expect(el.className).toContain("text-sm");
    expect(el.className).toContain("text-red-400");
  });
});

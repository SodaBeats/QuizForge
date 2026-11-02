import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../components/ui/EmptyState.jsx";

describe("EmptyState", () => {
  it("renders the message with the shared empty styling", () => {
    render(<EmptyState message="No quizzes yet" />);
    const el = screen.getByText("No quizzes yet");
    expect(el.className).toContain("text-muted");
    expect(el.className).toContain("text-center");
    expect(el.className).toContain("py-4");
  });

  it("appends className overrides (spacing/size call sites rely on it)", () => {
    render(<EmptyState message="No quizzes yet" className="text-sm py-8" />);
    const el = screen.getByText("No quizzes yet");
    expect(el.className).toContain("text-sm");
    expect(el.className).toContain("py-8");
    expect(el.className).toContain("py-4"); // base stays; Tailwind's order resolves it
  });
});

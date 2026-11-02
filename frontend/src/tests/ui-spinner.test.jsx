import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Spinner } from "../components/ui/Spinner.jsx";

describe("Spinner", () => {
  it("defaults to md size with accent tone", () => {
    const { container } = render(<Spinner />);
    const el = container.firstChild;
    expect(el.className).toContain("h-10 w-10");
    expect(el.className).toContain("border-4");
    expect(el.className).toContain("border-accent");
    expect(el.className).toContain("animate-spin");
    expect(el.className).toContain("border-t-transparent");
  });

  it.each([
    ["xs", "h-3.5 w-3.5", "border-2"],
    ["sm", "h-4 w-4", "border-2"],
    ["md", "h-10 w-10", "border-4"],
    ["lg", "h-12 w-12", "border-4"],
  ])("renders size %s with matching border width", (size, dims, border) => {
    const { container } = render(<Spinner size={size} />);
    const el = container.firstChild;
    expect(el.className).toContain(dims);
    expect(el.className).toContain(border);
  });

  it.each([
    ["accent", "border-accent"],
    ["red", "border-red-400"],
    ["accept", "border-accept"],
  ])("renders tone %s", (tone, expected) => {
    const { container } = render(<Spinner tone={tone} />);
    expect(container.firstChild.className).toContain(expected);
  });

  it("appends className for non-conflicting extras", () => {
    const { container } = render(
      <Spinner size="xs" tone="accept" className="shrink-0 motion-reduce:animate-none" />,
    );
    const el = container.firstChild;
    expect(el.className).toContain("shrink-0");
    expect(el.className).toContain("motion-reduce:animate-none");
    expect(el.className).toContain("h-3.5 w-3.5");
    expect(el.className).toContain("border-accept");
  });
});

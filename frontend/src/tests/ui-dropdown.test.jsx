import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Dropdown from "../components/ui/Dropdown.jsx";

const menu = (onPick = vi.fn()) => (
  <Dropdown>
    {({ open, toggle, close }) => (
      <>
        <button onClick={toggle}>Open menu</button>
        {open && (
          <div>
            <button
              onClick={() => {
                onPick();
                close();
              }}
            >
              Pick item
            </button>
          </div>
        )}
      </>
    )}
  </Dropdown>
);

describe("Dropdown", () => {
  it("starts closed, opens on trigger click", () => {
    render(menu());
    expect(screen.queryByText("Pick item")).toBeNull();
    fireEvent.click(screen.getByText("Open menu"));
    expect(screen.getByText("Pick item")).toBeInTheDocument();
  });

  it("toggles closed on a second trigger click", () => {
    render(menu());
    fireEvent.click(screen.getByText("Open menu"));
    fireEvent.click(screen.getByText("Open menu"));
    expect(screen.queryByText("Pick item")).toBeNull();
  });

  it("closes on mousedown outside the container", () => {
    render(
      <>
        <p>outside</p>
        {menu()}
      </>,
    );
    fireEvent.click(screen.getByText("Open menu"));
    expect(screen.getByText("Pick item")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("outside"));
    expect(screen.queryByText("Pick item")).toBeNull();
  });

  it("stays open when mousedown lands on the panel (item click)", () => {
    const onPick = vi.fn();
    render(menu(onPick));
    fireEvent.click(screen.getByText("Open menu"));
    fireEvent.mouseDown(screen.getByText("Pick item"));
    expect(screen.getByText("Pick item")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Pick item"));
    expect(onPick).toHaveBeenCalledTimes(1);
    // close() was called by the item handler
    expect(screen.queryByText("Pick item")).toBeNull();
  });
});

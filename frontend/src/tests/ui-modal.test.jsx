import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "../components/ui/Modal.jsx";

afterEach(() => {
  document.body.style.overflow = "";
});

const renderModal = (onClose = vi.fn(), extraProps = {}) =>
  render(
    <Modal
      onClose={onClose}
      panelClassName="modal-panel p-6"
      {...extraProps}
    >
      <h2>Modal title</h2>
      <button>Inside action</button>
    </Modal>,
  );

describe("Modal", () => {
  it("renders the panel through a portal on document.body", () => {
    renderModal();
    const panel = screen.getByRole("dialog");
    expect(panel).toBeInTheDocument();
    expect(panel.getAttribute("aria-modal")).toBe("true");
    // portal: the overlay lives at the end of body, not under the render container
    expect(panel.parentElement.classList.contains("fixed")).toBe(true);
    expect(document.body.lastElementChild).toBe(panel.parentElement);
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    renderModal(onClose);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores Escape when closeOnEscape is false", () => {
    const onClose = vi.fn();
    renderModal(onClose, { closeOnEscape: false });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when mousedown lands outside the panel (click-outside)", () => {
    const onClose = vi.fn();
    renderModal(onClose);
    const overlay = screen.getByRole("dialog").parentElement;
    fireEvent.mouseDown(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when mousedown lands inside the panel", () => {
    const onClose = vi.fn();
    renderModal(onClose);
    fireEvent.mouseDown(screen.getByText("Inside action"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores backdrop mousedown when closeOnBackdropClick is false", () => {
    const onClose = vi.fn();
    renderModal(onClose, { closeOnBackdropClick: false });
    const overlay = screen.getByRole("dialog").parentElement;
    fireEvent.mouseDown(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("locks body scroll while open and restores it on unmount", () => {
    const { unmount } = renderModal();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});

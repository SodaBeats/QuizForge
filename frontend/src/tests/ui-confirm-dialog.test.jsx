import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";

const renderDialog = (overrides = {}) =>
  render(
    <ConfirmDialog
      open
      message="This action cannot be undone."
      onConfirm={overrides.onConfirm ?? vi.fn()}
      onCancel={overrides.onCancel ?? vi.fn()}
    />,
  );

describe("ConfirmDialog", () => {
  it("renders nothing when not open", () => {
    render(<ConfirmDialog open={false} message="Nope" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText("Nope")).toBeNull();
  });

  it("renders the message and both actions when open", () => {
    renderDialog();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("fires onConfirm (and only onConfirm) when Confirm is clicked", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderDialog({ onConfirm, onCancel });
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("fires onCancel when Cancel is clicked", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderDialog({ onConfirm, onCancel });
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("fires onCancel on Escape (native-confirm-like dismissal)", () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

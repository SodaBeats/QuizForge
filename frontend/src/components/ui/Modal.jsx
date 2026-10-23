import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Shared modal shell (Phase 1.5 / F14 groundwork). Renders the overlay +
// panel through a portal on document.body and owns the interaction rules
// from the plan spec: Escape closes, mousedown outside the panel closes,
// Tab is trapped inside the panel, focus moves into the panel on open and
// is restored on close, and the page behind does not scroll.
//
// Call sites keep their exact overlay / panel classes via props — this
// extracts, it does not restyle. `closeOnBackdropClick` defaults to true
// but the three form modals (forge quiz, create class, add student) pass
// false so a stray click can't discard typed input or interrupt a submit;
// Escape still works there, like a native confirm dialog.
export default function Modal({
  onClose,
  panelClassName,
  backdropClassName = "bg-modalback/70",
  overlayClassName = "",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  overlayChild = null,
  children,
}) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape closes + Tab is trapped inside the panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (closeOnEscape) onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape]);

  // move focus into the panel on open; restore it on close
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    panelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  // page behind doesn't scroll while a modal is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleBackdropMouseDown = (e) => {
    if (closeOnBackdropClick && !panelRef.current?.contains(e.target)) {
      onCloseRef.current?.();
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 ${backdropClassName} flex items-center justify-center z-50 ${overlayClassName}`}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        // focus:outline-none keeps programmatic focus from painting a ring —
        // visual identity guard
        className={`${panelClassName} focus:outline-none`}
      >
        {children}
      </div>
      {overlayChild}
    </div>,
    document.body,
  );
}

import { useEffect, useRef } from "react";

// Shared click-outside detector (Phase 1.5 / F14 groundwork). Extracted
// verbatim from the 5 hand-rolled copies (StudentTopbar, QuizzesMetadata,
// StudentInfoModal, TeacherTopbar x2): same `mousedown` event, same contains() test.
// The handler runs through a ref so callers may pass inline arrows without
// re-attaching the listener on every render.
export function useClickOutside(ref, handler, enabled = true) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handlerRef.current(event);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, enabled]);
}

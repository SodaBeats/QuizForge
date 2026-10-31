import { useState, useRef } from "react";
import { useClickOutside } from "../../hooks/useClickOutside";

// Shared dropdown shell (Phase 1.5 / F14 groundwork). Replaces the 4
// hand-rolled click-outside menus (StudentTopbar + TopBar profile menus,
// TopBar + QuizzesMetadata class-access dropdowns): it owns the open state
// and the click-outside close, and renders its wrapper div around whatever
// trigger + panel markup the call site passes (via a render prop), so every
// site keeps its exact classes.
//
//   <Dropdown className="relative">
//     {({ open, toggle, close }) => (
//       <>
//         <button onClick={toggle}>…</button>
//         {open && <div className="absolute …">…</div>}
//       </>
//     )}
//   </Dropdown>
export function Dropdown({ className = "relative", children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useClickOutside(containerRef, () => setOpen(false));

  return (
    <div className={className} ref={containerRef}>
      {children({
        open,
        toggle: () => setOpen((wasOpen) => !wasOpen),
        close: () => setOpen(false),
      })}
    </div>
  );
}

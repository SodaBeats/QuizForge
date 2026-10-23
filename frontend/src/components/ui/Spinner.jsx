// Shared loading spinner (Phase 1.5). Extracted from the hand-rolled
// `animate-spin rounded-full border-accent` circles (SideBar loading
// states, ClassesPage submitting overlays). Primitive + tests only —
// call-site adoption is Phase 4.
export default function Spinner({ className = "" }) {
  return (
    <div
      className={`h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent ${className}`}
    />
  );
}

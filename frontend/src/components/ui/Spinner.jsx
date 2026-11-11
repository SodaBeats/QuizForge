// Shared loading spinner (Phase 1.5 primitive, adopted in Phase 4).
// `size`/`tone` cover the hand-rolled variants this replaced: the w-12
// submitting overlays in CreateClassModal/AddStudentModal (lg), the w-4 red
// delete spinner in ClassesSidebar (sm/red), FileSection's upload row
// (xs/accept), and the exact-match md/accent circles elsewhere.
// `className` is for non-conflicting extras only (shrink-0,
// motion-reduce:animate-none) — never size/border overrides: Tailwind
// resolves conflicting utilities by stylesheet order, not prop order.
const SIZES = {
  xs: "h-3.5 w-3.5 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-10 w-10 border-4",
  lg: "h-12 w-12 border-4",
};

const TONES = {
  accent: "border-accent",
  red: "border-red-400",
  accept: "border-accept",
  spinnergreen: "border-spinnergreen",
};

export function Spinner({
  size = "md",
  tone = "spinnergreen",
  className = "",
}) {
  return (
    <div
      className={`animate-spin rounded-full ${SIZES[size]} ${TONES[tone]} border-t-transparent ${className}`}
    />
  );
}

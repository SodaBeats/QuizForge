// Shared button primitive (Phase 1.5 / F14 groundwork). Variants reuse the
// shared recipes from styles/components.css; call sites append their own
// spacing / size deltas via className. Ships as a primitive — call-site
// adoption is Phase 4 (each file gets touched exactly once, by the phase
// that owns it).
const BUTTON_VARIANTS = {
  // green brand action (Forge quiz, Upload, Create class, …)
  primary:
    "btn-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600",
  // quiet neutral action (Cancel, pagination, …)
  secondary: "btn-secondary disabled:opacity-50 disabled:cursor-not-allowed",
  // red destructive action (Delete …)
  danger: "btn-danger disabled:opacity-50 disabled:cursor-not-allowed",
  // bare text-ish action, no border/background at rest
  ghost: "rounded-md px-4 transition-all text-inkondark hover:bg-muted/20",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      className={`${BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

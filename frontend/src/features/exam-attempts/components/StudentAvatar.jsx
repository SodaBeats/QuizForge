function getInitials(name = "") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function StudentAvatar({ name, size = "md" }) {
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";

  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} shrink-0 rounded-full bg-accent/15 border border-accent/40 text-accent font-display font-bold flex items-center justify-center`}
    >
      {getInitials(name) || "?"}
    </span>
  );
}

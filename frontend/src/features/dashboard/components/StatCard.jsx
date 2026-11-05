// One stat tile on the dashboard's top row: uppercase label over a big
// value. There is no Card primitive (Phase 1.5 shipped 8 components, no
// Card) — this is the dashboard's own, following the house card recipe
// (rounded-lg bg-surface border-muted/20, no shadows/gradients).
export function StatCard({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface border border-muted/20 p-4">
      <span className="text-xs font-display font-semibold text-muted uppercase tracking-widest">
        {label}
      </span>
      <span className="font-display font-bold text-inkondark text-2xl">
        {value}
      </span>
    </div>
  );
}

// Shared "nothing here" state (Phase 1.5). Matches the hand-rolled
// `text-muted text-center py-4` empty messages (SideBar "No documents
// found", dropdowns' "No classes found", …). Primitive + tests only —
// call-site adoption is Phase 4.
export default function EmptyState({ message, className = "" }) {
  return (
    <p className={`text-muted text-center py-4 ${className}`}>{message}</p>
  );
}

// Shared error state (Phase 1.5). Matches the hand-rolled
// `text-red-400 text-center py-4` error messages (SideBar "Something went
// wrong while fetching documents", …). Primitive + tests only — call-site
// adoption is Phase 4.
export function ErrorState({ message, className = "" }) {
  return (
    <p className={`text-red-400 text-center py-4 ${className}`}>{message}</p>
  );
}

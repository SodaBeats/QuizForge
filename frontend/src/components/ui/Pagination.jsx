import { Button } from "./Button";

// Shared pager (Phase 4): prev/next + "Page x of y", disabled at the
// bounds. Hidden on a single page — there is nothing to page through.
// Adopted by the dashboard's active-exams and expiring-soon lists.
export function Pagination({ page, totalPages, onPageChange, className = "" }) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-between gap-2 font-body text-sm text-inkondark ${className}`}
    >
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5"
      >
        Prev
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button
        variant="secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5"
      >
        Next
      </Button>
    </nav>
  );
}

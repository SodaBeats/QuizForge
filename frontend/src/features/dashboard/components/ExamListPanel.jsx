import { Spinner } from "../../../components/ui/Spinner";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Pagination } from "../../../components/ui/Pagination";

// Shared chrome for the dashboard's two exam lists: header strip, row area
// with loading/error/empty states, and a pager footer (hidden unless the
// list actually spans multiple pages). Rows come from `renderRow` so the
// active-exams and expiring-soon lists differ only in their cells.
export function ExamListPanel({ title, query, emptyMessage, renderRow, onPageChange }) {
  const { data, isPending, isError } = query;

  return (
    <section className="flex flex-col rounded-lg bg-surface border border-muted/20 overflow-hidden">
      <header className="p-4 bg-specialsurface border-b border-muted/20">
        <h2 className="text-xs font-display font-semibold text-muted uppercase tracking-widest">
          {title}
        </h2>
      </header>

      <div className="flex-1 p-4 space-y-2">
        {isPending && (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        )}
        {isError && (
          <ErrorState message={`Failed to load ${title.toLowerCase()}`} />
        )}
        {!isPending && !isError && (
          <>
            {data.items.length > 0 ? (
              data.items.map((item) => (
                <div key={item.id}>{renderRow(item)}</div>
              ))
            ) : (
              <EmptyState message={emptyMessage} />
            )}
          </>
        )}
      </div>

      {!isPending && !isError && data.totalPages > 1 && (
        <footer className="p-3 border-t border-muted/20">
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={onPageChange}
          />
        </footer>
      )}
    </section>
  );
}

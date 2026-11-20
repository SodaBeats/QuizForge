import { Spinner } from "../../../components/ui/Spinner";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Pagination } from "../../../components/ui/Pagination";

// Shared chrome for the admin dashboard's two lists — the ExamListPanel
// pattern, but reading the /admin/* list shape ({ data, total }) instead of
// the teacher dashboard's { items, page, totalPages }. totalPages is derived
// from the page size the caller fetched. Rows come from `renderRow`.
export function AdminListPanel({
  title,
  query,
  page,
  limit,
  onPageChange,
  emptyMessage,
  renderRow,
}) {
  const { data, isPending, isError } = query;
  const rows = data?.data ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 0;

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
            {rows.length > 0 ? (
              rows.map((item) => <div key={item.id}>{renderRow(item)}</div>)
            ) : (
              <EmptyState message={emptyMessage} />
            )}
          </>
        )}
      </div>

      {!isPending && !isError && totalPages > 1 && (
        <footer className="p-3 border-t border-muted/20">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </footer>
      )}
    </section>
  );
}

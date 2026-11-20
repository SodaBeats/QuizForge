import { Spinner } from "../../../components/ui/Spinner";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Pagination } from "../../../components/ui/Pagination";
import { Dropdown } from "../../../components/ui/Dropdown";

function formatDateTime(iso) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : "";
}

// Badges follow the house StatusBadge pattern (inline Tailwind spans, theme
// tokens only): green = good, amber = needs attention, red = suspended.
function VerifiedBadge({ verified }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold border ${
        verified
          ? "bg-accept/15 text-accept border-accept/30"
          : "bg-warn/15 text-warn border-warn/30"
      }`}
    >
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}

function StatusBadge({ suspended }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold border ${
        suspended
          ? "bg-bad/15 text-bad border-bad/30"
          : "bg-accept/15 text-accept border-accept/30"
      }`}
    >
      {suspended ? "Suspended" : "Active"}
    </span>
  );
}

// Kebab items by state: Change Role + Delete always; Suspend/Unsuspend by
// suspended_at; Verify/Unverify only for teachers (by is_verified).
function buildMenuItems(user, handlers) {
  const items = [
    { label: "Change Role", onClick: () => handlers.onChangeRole(user) },
    user.suspended_at
      ? { label: "Unsuspend User", onClick: () => handlers.onUnsuspend(user) }
      : { label: "Suspend User", onClick: () => handlers.onSuspend(user) },
  ];

  if (user.role === "teacher") {
    items.push(
      user.is_verified
        ? { label: "Unverify User", onClick: () => handlers.onUnverify(user) }
        : { label: "Verify User", onClick: () => handlers.onVerify(user) },
    );
  }

  items.push({ label: "Delete User", danger: true, onClick: () => handlers.onDelete(user) });
  return items;
}

function UserRow({ user, currentUserId, handlers }) {
  // No kebab on the logged-in admin's own row.
  const isSelf = currentUserId != null && user.id === currentUserId;

  return (
    <tr className="border-t border-muted/20 hover:bg-mutedteal/20 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-inkondark whitespace-nowrap">
        {user.first_name} {user.last_name}
      </td>
      <td className="px-4 py-3 text-sm text-muted">{user.email}</td>
      <td className="px-4 py-3 text-sm text-inkondark whitespace-nowrap">
        {capitalize(user.role)}
      </td>
      <td className="px-4 py-3">
        <VerifiedBadge verified={user.is_verified} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge suspended={Boolean(user.suspended_at)} />
      </td>
      <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
        {formatDateTime(user.created_at)}
      </td>
      <td className="px-4 py-3 text-right align-top">
        {!isSelf && (
          <Dropdown className="relative inline-block">
            {({ open, toggle, close }) => (
              <>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={`Actions for ${user.first_name} ${user.last_name}`}
                  aria-expanded={open}
                  className="rounded-md px-2 py-1 text-lg leading-none text-inkondark hover:bg-muted/20 border-none"
                >
                  ⋮
                </button>
                {open && (
                  <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-muted/30 bg-specialsurface py-1 text-left font-body text-sm">
                    {buildMenuItems(user, handlers).map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          close();
                          item.onClick();
                        }}
                        className={`block w-full px-3 py-2 text-left transition-colors hover:bg-mutedteal ${
                          item.danger ? "text-bad" : "text-inkondark"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Dropdown>
        )}
      </td>
    </tr>
  );
}

// One tab's paginated table. The page owns tab/page state, the query, and
// every mutation handler; this renders rows, the kebab, and the pager.
export function UsersTable({
  query,
  page,
  limit,
  onPageChange,
  currentUserId,
  onChangeRole,
  onSuspend,
  onUnsuspend,
  onVerify,
  onUnverify,
  onDelete,
}) {
  const { data, isPending, isError } = query;
  const rows = data?.data ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 0;
  const handlers = { onChangeRole, onSuspend, onUnsuspend, onVerify, onUnverify, onDelete };

  return (
    <section className="rounded-lg bg-surface border border-muted/20 overflow-hidden">
      {isPending && (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      )}
      {isError && (
        <div className="p-4">
          <ErrorState message="Failed to load users" />
        </div>
      )}
      {!isPending && !isError && rows.length === 0 && (
        <div className="p-4">
          <EmptyState message="No users in this tab" />
        </div>
      )}

      {!isPending && !isError && rows.length > 0 && (
        <table className="w-full font-body">
          <thead className="bg-specialsurface">
            <tr className="text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Verified</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                handlers={handlers}
              />
            ))}
          </tbody>
        </table>
      )}

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

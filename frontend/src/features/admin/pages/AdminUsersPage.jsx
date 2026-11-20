import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../../../app/providers/AuthProvider";
import { AdminLayout } from "../components/AdminLayout";
import { UsersTable } from "../components/UsersTable";
import { AddUserModal } from "../components/AddUserModal";
import { ChangeRoleModal } from "../components/ChangeRoleModal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Button } from "../../../components/ui/Button";
import { useAdminUsers } from "../api/queries";
import {
  useCreateUser,
  useDeleteUser,
  useSuspendUser,
  useUnsuspendUser,
  useUpdateUser,
} from "../api/mutations";

const PAGE_SIZE = 10;

const TABS = [
  { role: "teacher", label: "Teachers" },
  { role: "student", label: "Students" },
  { role: "admin", label: "Admins" },
];

export function AdminUsersPage() {
  const { userInfo } = useContext(AuthContext);
  const [tab, setTab] = useState("teacher");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const usersQuery = useAdminUsers({ role: tab, page, limit: PAGE_SIZE });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const suspendUser = useSuspendUser();
  const unsuspendUser = useUnsuspendUser();
  const deleteUser = useDeleteUser();

  const handleTab = (role) => {
    setTab(role);
    setPage(1);
  };

  const handleSuspendConfirm = () => {
    const target = suspendTarget;
    if (!target) return;
    suspendUser.mutate(target.id, {
      onSuccess: () => {
        setSuspendTarget(null);
        toast.success(`${target.first_name} suspended`);
      },
    });
  };

  const handleUnsuspend = (user) => {
    unsuspendUser.mutate(user.id, {
      onSuccess: () => toast.success(`${user.first_name} unsuspended`),
    });
  };

  const handleDeleteConfirm = () => {
    const target = deleteTarget;
    if (!target) return;
    deleteUser.mutate(target.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        // If that row was the only one on this page, step back one page so
        // the refetch doesn't strand us past the end of the list.
        if (usersQuery.data?.data.length === 1 && page > 1) {
          setPage(page - 1);
        }
        toast.success("User deleted");
      },
    });
  };

  const handleVerify = (user, verified) => {
    updateUser.mutate(
      { id: user.id, body: { is_verified: verified } },
      {
        onSuccess: () =>
          toast.success(verified ? "Teacher verified!" : "Verification removed"),
      },
    );
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-display font-semibold text-inkondark">
          User Management
        </h1>
        <Button variant="primary" className="py-2 text-sm" onClick={() => setAddOpen(true)}>
          Add User
        </Button>
      </div>

      {/* Tabs: each keeps its own page state (reset to 1 on switch). */}
      <div className="flex gap-1" role="tablist" aria-label="User roles">
        {TABS.map(({ role, label }) => (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={tab === role}
            onClick={() => handleTab(role)}
            className={`rounded-md px-4 py-2 text-sm font-body transition-colors ${
              tab === role
                ? "bg-accent text-inkondark font-medium"
                : "text-muted hover:bg-mutedteal hover:text-inkondark"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <UsersTable
        query={usersQuery}
        page={page}
        limit={PAGE_SIZE}
        onPageChange={setPage}
        currentUserId={userInfo?.id}
        onChangeRole={(user) => setRoleTarget(user)}
        onSuspend={(user) => setSuspendTarget(user)}
        onUnsuspend={handleUnsuspend}
        onVerify={(user) => handleVerify(user, true)}
        onUnverify={(user) => handleVerify(user, false)}
        onDelete={(user) => setDeleteTarget(user)}
      />

      {addOpen && (
        <AddUserModal
          onClose={() => setAddOpen(false)}
          onSubmit={(body) => createUser.mutateAsync(body)}
        />
      )}

      {roleTarget && (
        <ChangeRoleModal
          user={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSubmit={(args) => updateUser.mutateAsync(args)}
        />
      )}

      <ConfirmDialog
        open={Boolean(suspendTarget)}
        title="Suspend user?"
        message={
          suspendTarget
            ? `${suspendTarget.first_name} ${suspendTarget.last_name} will no longer be able to sign in.`
            : null
        }
        confirmLabel="Suspend"
        onConfirm={handleSuspendConfirm}
        onCancel={() => setSuspendTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user?"
        message={
          deleteTarget
            ? `This will permanently delete ${deleteTarget.first_name} ${deleteTarget.last_name}.`
            : null
        }
        disclaimer="This also deletes the user's quizzes and attempts. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}

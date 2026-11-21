import { useState } from "react";
import toast from "react-hot-toast";
import { AdminLayout } from "../components/AdminLayout";
import { AdminListPanel } from "../components/AdminListPanel";
import { Button } from "../../../components/ui/Button";
import { useAdminExams, useAdminStats, useAdminUsers } from "../api/queries";
import { useUpdateUser } from "../api/mutations";

const PAGE_SIZE = 10;

// Local copy of the dashboard's StatCard — this repo keeps features
// self-contained (no cross-feature component imports), and the card is a
// ten-line presentational tile.
function StatCard({ label, value }) {
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

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

function formatDateTime(iso) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

// Metadata-only row for "Recently Created Exams".
function ExamRow({ exam }) {
  const published = exam.status === "published";
  return (
    <div className="rounded-md bg-darkslate border border-muted/20 px-3 py-2.5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-inkondark truncate">
          {exam.quiz_title}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {exam.teacher.first_name} {exam.teacher.last_name}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs text-muted whitespace-nowrap space-y-0.5">
        <p>
          <span
            className={`inline-block rounded-md px-1.5 py-0.5 font-semibold ${
              published ? "bg-green-900/50 text-green-300" : "bg-amber-900/50 text-amber-300"
            }`}
          >
            {exam.status}
          </span>
        </p>
        <p>Due {formatDate(exam.due_date)}</p>
        <p>{formatDateTime(exam.created_at)}</p>
      </div>
    </div>
  );
}

// Verify button row for "Teachers Needing Verification".
function PendingTeacherRow({ teacher, onVerify, verifying }) {
  return (
    <div className="rounded-md bg-darkslate border border-muted/20 px-3 py-2.5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-inkondark truncate">
          {teacher.first_name} {teacher.last_name}
        </p>
        <p className="text-xs text-muted mt-0.5 truncate">{teacher.email}</p>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        <span className="text-xs text-muted whitespace-nowrap">
          {formatDate(teacher.created_at)}
        </span>
        <Button
          variant="primary"
          className="px-3 py-1.5 text-xs"
          disabled={verifying}
          onClick={() => onVerify(teacher)}
        >
          Verify
        </Button>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const statsQuery = useAdminStats();
  const [pendingPage, setPendingPage] = useState(1);
  const [examPage, setExamPage] = useState(1);

  // "Needs verification" = teacher, unverified, not suspended (the backend
  // applies that definition to role=teacher&verified=false).
  const pendingQuery = useAdminUsers({
    role: "teacher",
    verified: false,
    page: pendingPage,
    limit: PAGE_SIZE,
  });
  const examsQuery = useAdminExams({ page: examPage, limit: PAGE_SIZE });

  const verifyUser = useUpdateUser();
  const handleVerify = (teacher) => {
    verifyUser.mutate(
      { id: teacher.id, body: { is_verified: true } },
      { onSuccess: () => toast.success("Teacher verified!") },
    );
  };

  const stats = statsQuery.data;
  const cards = [
    { label: "Teachers", value: stats?.teachers ?? "—" },
    { label: "Students", value: stats?.students ?? "—" },
    { label: "Exams", value: stats?.exams ?? "—" },
    { label: "Teachers Needing Verification", value: stats?.pendingTeachers ?? "—" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-xl font-display font-semibold text-inkondark">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {cards.map(({ label, value }) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <AdminListPanel
          title="Teachers Needing Verification"
          query={pendingQuery}
          page={pendingPage}
          limit={PAGE_SIZE}
          onPageChange={setPendingPage}
          emptyMessage="All teachers are verified"
          renderRow={(teacher) => (
            <PendingTeacherRow
              teacher={teacher}
              onVerify={handleVerify}
              verifying={verifyUser.isPending}
            />
          )}
        />

        <AdminListPanel
          title="Recently Created Exams"
          query={examsQuery}
          page={examPage}
          limit={PAGE_SIZE}
          onPageChange={setExamPage}
          emptyMessage="No exams yet"
          renderRow={(exam) => <ExamRow exam={exam} />}
        />
      </div>
    </AdminLayout>
  );
}

/* Panel 1 — read-only exam metadata for the Exam Attempts page.
   Fields mirror QuizzesMetadata but with no inputs or actions. */

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(iso) {
  if (!iso) return "—";
  return dateFormatter.format(new Date(iso));
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-display font-semibold text-muted uppercase tracking-widest">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-inkondark font-body break-words">
        {children}
      </dd>
    </div>
  );
}

function StatusBadge({ status }) {
  const published = status === "published";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
        published ? "bg-green-900/50 text-green-300" : "bg-amber-900/50 text-amber-300"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function ExamDetailsPanel({ exam }) {
  if (!exam) {
    return (
      <aside className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col font-body p-3">
        <div className="flex-1 rounded-lg bg-surface border border-muted/20 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-muted">No attempt data for this exam</p>
        </div>
      </aside>
    );
  }

  const restricted = exam.accessibility === "restricted";

  return (
    <aside className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col font-body p-3">
      <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-muted/20">
        {/* Header */}
        <div className="p-4 bg-specialsurface border-b border-muted/20">
          <p className="text-xs font-display font-semibold text-muted uppercase tracking-widest mb-2">
            Exam details
          </p>
          <h1 className="text-lg font-display font-bold text-inkondark">
            {exam.title}
          </h1>
          <p className="text-xs text-muted mt-1">
            {exam.questionCount} questions • {exam.maxAttempts} attempts allowed
          </p>
        </div>

        {/* Fields */}
        <dl className="flex-1 p-4 space-y-4 overflow-y-auto">
          <Field label="Description">
            {exam.description || "—"}
          </Field>
          <Field label="Status">
            <StatusBadge status={exam.status} />
          </Field>
          <Field label="Due date">{formatDate(exam.dueDate)}</Field>
          <Field label="Created">{formatDate(exam.createdAt)}</Field>
          <Field label="Who can access">
            {restricted ? "Restricted" : "Open to anyone"}
            {restricted && exam.allowedClasses.length > 0 && (
              <span className="block text-muted mt-0.5">
                {exam.allowedClasses.map((cls) => cls.name).join(", ")}
              </span>
            )}
          </Field>
          <Field label="Share token">
            <span className="text-muted">{exam.shareToken}</span>
          </Field>
        </dl>
      </div>
    </aside>
  );
}

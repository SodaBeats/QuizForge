/* Date/time formatting for the Exam Attempts page (local time, locale default). */

const submittedFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Attempt submission date, e.g. "Nov 5, 2026, 9:00 AM". */
export function formatSubmittedAt(isoDate) {
  return submittedFormatter.format(new Date(isoDate));
}

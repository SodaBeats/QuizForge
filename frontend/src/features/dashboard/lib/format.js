/* Date formatting for the dashboard (local time, locale default). */

const dueDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDueDate(isoDate) {
  return dueDateFormatter.format(new Date(isoDate));
}

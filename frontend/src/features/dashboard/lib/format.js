/* Date/time formatting for the dashboard (local time, locale default). */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const dueDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDueDate(isoDate) {
  return dueDateFormatter.format(new Date(isoDate));
}

/** Urgency label for the expiring-soon list: "2d 4h left", "4h 20m left",
    "2h left", "<1h left". `now` is injectable so tests stay deterministic
    (the mock due dates are relative to load time). Past due dates read as
    "<1h left" — the list itself only ever holds future due dates. */
export function formatTimeLeft(isoDate, now = Date.now()) {
  const remaining = Date.parse(isoDate) - now;
  if (remaining < HOUR_MS) return "<1h left";

  const hours = Math.floor(remaining / HOUR_MS);
  if (hours < 24) {
    const minutes = Math.floor((remaining % HOUR_MS) / MINUTE_MS);
    return minutes ? `${hours}h ${minutes}m left` : `${hours}h left`;
  }

  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days}d ${restHours}h left` : `${days}d left`;
}

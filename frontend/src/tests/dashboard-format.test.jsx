import { describe, it, expect } from "vitest";
import { formatTimeLeft } from "../features/dashboard/lib/format";

const NOW = Date.parse("2026-11-06T12:00:00.000Z");
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const at = (offsetMs) => new Date(NOW + offsetMs).toISOString();

describe("formatTimeLeft", () => {
  it("reads anything under an hour (including past due) as <1h left", () => {
    expect(formatTimeLeft(at(30 * MIN), NOW)).toBe("<1h left");
    expect(formatTimeLeft(at(-5 * MIN), NOW)).toBe("<1h left");
  });

  it("shows hours and minutes inside a day", () => {
    expect(formatTimeLeft(at(4 * HOUR + 20 * MIN), NOW)).toBe("4h 20m left");
    expect(formatTimeLeft(at(2 * HOUR), NOW)).toBe("2h left");
  });

  it("shows days and hours beyond a day", () => {
    expect(formatTimeLeft(at(2 * DAY + 4 * HOUR), NOW)).toBe("2d 4h left");
    expect(formatTimeLeft(at(3 * DAY), NOW)).toBe("3d left");
  });
});

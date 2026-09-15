import type { TaskRow, WeeklyConfig, MonthlyConfig } from "../types";

function parseDate(s: string): Date {
  return new Date(`${s}T00:00:00Z`);
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

/**
 * Returns the list of YYYY-MM-DD occurrence dates for a task, clamped to
 * [rangeStart, rangeEnd] (inclusive), also clamped to the task's own
 * start_date/end_date.
 */
export function getOccurrencesInRange(task: TaskRow, rangeStart: string, rangeEnd: string): string[] {
  const lo = parseDate(task.start_date) > parseDate(rangeStart) ? task.start_date : rangeStart;
  const hi = task.end_date && parseDate(task.end_date) < parseDate(rangeEnd) ? task.end_date : rangeEnd;

  if (parseDate(lo) > parseDate(hi)) return [];

  const dates: string[] = [];

  if (task.repeat_type === "once") {
    if (task.start_date >= rangeStart && task.start_date <= rangeEnd) {
      if (!task.end_date || task.start_date <= task.end_date) dates.push(task.start_date);
    }
    return dates;
  }

  if (task.repeat_type === "daily") {
    let cur = parseDate(lo);
    const end = parseDate(hi);
    while (cur <= end) {
      dates.push(fmt(cur));
      cur = addDays(cur, 1);
    }
    return dates;
  }

  if (task.repeat_type === "weekly") {
    const config = JSON.parse(task.repeat_config || "{}") as WeeklyConfig;
    const weekdays = new Set(config.weekdays ?? []);
    let cur = parseDate(lo);
    const end = parseDate(hi);
    while (cur <= end) {
      if (weekdays.has(cur.getUTCDay())) dates.push(fmt(cur));
      cur = addDays(cur, 1);
    }
    return dates;
  }

  if (task.repeat_type === "monthly") {
    const config = JSON.parse(task.repeat_config || "{}") as MonthlyConfig;
    const dayOfMonth = config.dayOfMonth ?? 1;
    let cur = parseDate(lo);
    const end = parseDate(hi);
    // walk month by month
    let y = cur.getUTCFullYear();
    let m = cur.getUTCMonth();
    while (true) {
      const dim = daysInMonth(y, m);
      const day = Math.min(dayOfMonth, dim);
      const candidate = new Date(Date.UTC(y, m, day));
      if (candidate > end) break;
      if (candidate >= cur && candidate >= parseDate(lo) && candidate <= end) {
        dates.push(fmt(candidate));
      }
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      if (new Date(Date.UTC(y, m, 1)) > end) break;
    }
    return dates;
  }

  return dates;
}

export function monthRange(month: string): { start: string; end: string } {
  // month = "YYYY-MM"
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const lastDay = daysInMonth(y, m - 1);
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

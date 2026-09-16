import {
  format,
  isToday,
  isYesterday,
  startOfWeek,
  subWeeks,
  addWeeks,
  differenceInCalendarDays,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "Asia/Kolkata";

export function nowIso(): string {
  return new Date().toISOString();
}

export function toIst(date: Date): Date {
  return toZonedTime(date, TZ);
}

export function formatRelativeContact(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const days = differenceInCalendarDays(new Date(), d);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days <= 30) return `${days} days ago`;
  return format(d, "d MMM yyyy");
}

export function formatFeedDateHeader(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "today";
  if (isYesterday(d)) return "yesterday";
  return format(d, "d MMM yyyy");
}

export function formatTime(iso: string): string {
  return format(toIst(new Date(iso)), "HH:mm");
}

export function formatSnapshotDate(iso: string): string {
  return format(toIst(new Date(iso)), "d MMM");
}

export function weekStartMonday(date: Date): Date {
  return startOfWeek(toIst(date), { weekStartsOn: 1 });
}

export function getWeekBuckets(
  snapshotDates: string[],
  visibleCount = 8
): { weekStart: Date; count: number; label: string }[] {
  if (snapshotDates.length === 0) return [];

  const counts = new Map<string, number>();
  for (const iso of snapshotDates) {
    const ws = weekStartMonday(new Date(iso));
    const key = ws.toISOString();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const allWeeks = [...counts.keys()]
    .map((k) => new Date(k))
    .sort((a, b) => a.getTime() - b.getTime());

  const first = allWeeks[0];
  const currentWeek = weekStartMonday(new Date());
  const weeks: Date[] = [];
  let cursor = first;
  while (cursor <= currentWeek) {
    weeks.push(cursor);
    cursor = addWeeks(cursor, 1);
  }

  const slice =
    weeks.length > visibleCount ? weeks.slice(-visibleCount) : weeks;

  return slice.map((weekStart) => {
    const key = weekStart.toISOString();
    return {
      weekStart,
      count: counts.get(key) ?? 0,
      label: format(weekStart, "d MMM"),
    };
  });
}

export function computeStreak(
  snapshotDates: string[],
  benchmark = 3
): number {
  const counts = new Map<string, number>();
  for (const iso of snapshotDates) {
    const ws = weekStartMonday(new Date(iso));
    const key = ws.toISOString();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const currentWeek = weekStartMonday(new Date());
  const currentKey = currentWeek.toISOString();
  const currentCount = counts.get(currentKey) ?? 0;

  let streak = 0;
  let week = subWeeks(currentWeek, 1);

  while (true) {
    const key = week.toISOString();
    const c = counts.get(key) ?? 0;
    if (c >= benchmark) {
      streak += 1;
      week = subWeeks(week, 1);
    } else {
      break;
    }
  }

  if (currentCount >= benchmark) {
    streak += 1;
  }

  return streak;
}

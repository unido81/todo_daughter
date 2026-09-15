import type { Env } from "../types";

export function newId(): string {
  return crypto.randomUUID();
}

export async function getPointsBalance(db: Env["DB"]): Promise<number> {
  const earnedRow = await db
    .prepare(`SELECT COALESCE(SUM(points_awarded), 0) AS total FROM task_completions`)
    .first<{ total: number }>();
  const spentRow = await db
    .prepare(`SELECT COALESCE(SUM(points_spent), 0) AS total FROM redemptions WHERE status != 'rejected'`)
    .first<{ total: number }>();
  const earned = earnedRow?.total ?? 0;
  const spent = spentRow?.total ?? 0;
  return earned - spent;
}

import type { Env, Role } from "../types";

const MAX_FAILURES = 5;
const LOCK_MINUTES = 10;

export async function isLoginLocked(db: Env["DB"], role: Role): Promise<{ locked: boolean; retryAfterMinutes?: number }> {
  const row = await db.prepare(`SELECT locked_until FROM login_attempts WHERE role = ?1`).bind(role).first<{ locked_until: string | null }>();
  if (!row?.locked_until) return { locked: false };

  const lockedUntil = new Date(`${row.locked_until.replace(" ", "T")}Z`);
  const now = new Date();
  if (lockedUntil > now) {
    const retryAfterMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
    return { locked: true, retryAfterMinutes };
  }
  return { locked: false };
}

export async function recordLoginFailure(db: Env["DB"], role: Role): Promise<void> {
  const row = await db.prepare(`SELECT fail_count FROM login_attempts WHERE role = ?1`).bind(role).first<{ fail_count: number }>();
  const nextCount = (row?.fail_count ?? 0) + 1;
  const lockedUntil = nextCount >= MAX_FAILURES ? `datetime('now', '+${LOCK_MINUTES} minutes')` : "NULL";

  await db
    .prepare(
      `INSERT INTO login_attempts (role, fail_count, locked_until, updated_at)
       VALUES (?1, ?2, ${lockedUntil}, datetime('now'))
       ON CONFLICT(role) DO UPDATE SET fail_count = ?2, locked_until = ${lockedUntil}, updated_at = datetime('now')`,
    )
    .bind(role, nextCount)
    .run();
}

export async function resetLoginAttempts(db: Env["DB"], role: Role): Promise<void> {
  await db
    .prepare(
      `INSERT INTO login_attempts (role, fail_count, locked_until, updated_at) VALUES (?1, 0, NULL, datetime('now'))
       ON CONFLICT(role) DO UPDATE SET fail_count = 0, locked_until = NULL, updated_at = datetime('now')`,
    )
    .bind(role)
    .run();
}

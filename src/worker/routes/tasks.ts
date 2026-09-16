import { Hono } from "hono";
import type { AppEnv, TaskRow, CompletionRow, Category, RepeatType } from "../types";
import { requireAuth, requireDad } from "../lib/auth";
import { newId } from "../lib/db";
import { getOccurrencesInRange, monthRange, todayStr } from "../lib/occurrences";

const tasks = new Hono<AppEnv>();

interface TaskPayload {
  title: string;
  category: Category;
  repeatType: RepeatType;
  repeatConfig: Record<string, unknown>;
  startDate: string;
  endDate: string | null;
  points: number;
  memo: string | null;
}

function validatePayload(body: unknown): { ok: true; value: TaskPayload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "요청 형식이 올바르지 않습니다." };
  const b = body as Record<string, unknown>;
  if (typeof b.title !== "string" || b.title.trim().length === 0) return { ok: false, error: "제목을 입력해주세요." };
  const validCategories: Category[] = ["homework", "supplies", "exam", "event", "notice", "other"];
  if (typeof b.category !== "string" || !validCategories.includes(b.category as Category)) {
    return { ok: false, error: "카테고리가 올바르지 않습니다." };
  }
  const validRepeat: RepeatType[] = ["once", "daily", "weekly", "monthly"];
  if (typeof b.repeatType !== "string" || !validRepeat.includes(b.repeatType as RepeatType)) {
    return { ok: false, error: "반복 유형이 올바르지 않습니다." };
  }
  if (typeof b.startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.startDate)) {
    return { ok: false, error: "시작 날짜가 올바르지 않습니다." };
  }
  if (b.repeatType === "weekly") {
    const cfg = b.repeatConfig as { weekdays?: unknown };
    if (!Array.isArray(cfg?.weekdays) || cfg.weekdays.length === 0) {
      return { ok: false, error: "매주 반복은 요일을 하나 이상 선택해주세요." };
    }
  }
  if (b.repeatType === "monthly") {
    const cfg = b.repeatConfig as { dayOfMonth?: unknown };
    if (typeof cfg?.dayOfMonth !== "number" || cfg.dayOfMonth < 1 || cfg.dayOfMonth > 31) {
      return { ok: false, error: "매월 반복은 날짜(1~31)를 선택해주세요." };
    }
  }
  return {
    ok: true,
    value: {
      title: b.title.trim(),
      category: b.category as Category,
      repeatType: b.repeatType as RepeatType,
      repeatConfig: (b.repeatConfig as Record<string, unknown>) ?? {},
      startDate: b.startDate,
      endDate: typeof b.endDate === "string" && b.endDate ? b.endDate : null,
      points: typeof b.points === "number" && b.points >= 0 ? Math.floor(b.points) : 0,
      memo: typeof b.memo === "string" && b.memo ? b.memo : null,
    },
  };
}

tasks.get("/", requireAuth, async (c) => {
  const month = c.req.query("month") ?? todayStr().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) return c.json({ error: "month 파라미터가 올바르지 않습니다." }, 400);
  const { start, end } = monthRange(month);

  const { results: taskRows } = await c.env.DB.prepare(
    `SELECT * FROM tasks WHERE active = 1 AND start_date <= ?1 AND (end_date IS NULL OR end_date >= ?2) ORDER BY created_at DESC`,
  )
    .bind(end, start)
    .all<TaskRow>();

  const { results: completionRows } = await c.env.DB.prepare(
    `SELECT * FROM task_completions WHERE occurrence_date >= ?1 AND occurrence_date <= ?2`,
  )
    .bind(start, end)
    .all<CompletionRow>();

  const completedSet = new Set(completionRows.map((r) => `${r.task_id}|${r.occurrence_date}`));

  const payload = taskRows.map((t) => {
    const occurrenceDates = getOccurrencesInRange(t, start, end);
    return {
      id: t.id,
      title: t.title,
      category: t.category,
      repeatType: t.repeat_type,
      repeatConfig: JSON.parse(t.repeat_config || "{}"),
      startDate: t.start_date,
      endDate: t.end_date,
      points: t.points,
      memo: t.memo,
      source: t.source,
      occurrences: occurrenceDates.map((date) => ({
        date,
        completed: completedSet.has(`${t.id}|${date}`),
      })),
    };
  });

  return c.json({ month, tasks: payload });
});

tasks.post("/", requireDad, async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = validatePayload(body);
  if (!result.ok) return c.json({ error: result.error }, 400);
  const v = result.value;
  const id = newId();
  await c.env.DB.prepare(
    `INSERT INTO tasks (id, title, category, repeat_type, repeat_config, start_date, end_date, points, memo, source, active)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 1)`,
  )
    .bind(id, v.title, v.category, v.repeatType, JSON.stringify(v.repeatConfig), v.startDate, v.endDate, v.points, v.memo, "manual")
    .run();
  return c.json({ ok: true, id });
});

tasks.put("/:id", requireDad, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const result = validatePayload(body);
  if (!result.ok) return c.json({ error: result.error }, 400);
  const v = result.value;
  const existing = await c.env.DB.prepare(`SELECT id FROM tasks WHERE id = ?1`).bind(id).first();
  if (!existing) return c.json({ error: "할일을 찾을 수 없습니다." }, 404);
  await c.env.DB.prepare(
    `UPDATE tasks SET title=?2, category=?3, repeat_type=?4, repeat_config=?5, start_date=?6, end_date=?7, points=?8, memo=?9 WHERE id=?1`,
  )
    .bind(id, v.title, v.category, v.repeatType, JSON.stringify(v.repeatConfig), v.startDate, v.endDate, v.points, v.memo)
    .run();
  return c.json({ ok: true });
});

tasks.delete("/:id", requireDad, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare(`UPDATE tasks SET active = 0 WHERE id = ?1`).bind(id).run();
  return c.json({ ok: true });
});

tasks.post("/:id/complete", requireAuth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ date?: string }>().catch(() => ({}) as { date?: string });
  const date = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : todayStr();

  const task = await c.env.DB.prepare(`SELECT * FROM tasks WHERE id = ?1 AND active = 1`).bind(id).first<TaskRow>();
  if (!task) return c.json({ error: "할일을 찾을 수 없습니다." }, 404);

  const already = await c.env.DB.prepare(`SELECT id FROM task_completions WHERE task_id = ?1 AND occurrence_date = ?2`)
    .bind(id, date)
    .first();
  if (already) return c.json({ ok: true, alreadyCompleted: true });

  await c.env.DB.prepare(
    `INSERT INTO task_completions (id, task_id, occurrence_date, points_awarded) VALUES (?1, ?2, ?3, ?4)`,
  )
    .bind(newId(), id, date, task.points)
    .run();

  return c.json({ ok: true, pointsAwarded: task.points });
});

tasks.post("/:id/uncomplete", requireAuth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ date?: string }>().catch(() => ({}) as { date?: string });
  const date = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : todayStr();
  await c.env.DB.prepare(`DELETE FROM task_completions WHERE task_id = ?1 AND occurrence_date = ?2`).bind(id, date).run();
  return c.json({ ok: true });
});

export default tasks;

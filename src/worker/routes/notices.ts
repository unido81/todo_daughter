import { Hono } from "hono";
import type { AppEnv, Category } from "../types";
import { requireDad } from "../lib/auth";
import { classifyNotice } from "../lib/classify";
import { newId } from "../lib/db";
import { todayStr } from "../lib/occurrences";

const notices = new Hono<AppEnv>();

notices.post("/classify", requireDad, async (c) => {
  const body = await c.req.json<{ text?: string }>().catch(() => null);
  if (!body || typeof body.text !== "string" || body.text.trim().length === 0) {
    return c.json({ error: "붙여넣은 알림장 내용이 없습니다." }, 400);
  }
  const items = classifyNotice(body.text);
  return c.json({ items });
});

interface ImportItem {
  title: string;
  category: Category;
  date: string;
  points?: number;
  memo?: string;
}

notices.post("/import", requireDad, async (c) => {
  const body = await c.req.json<{ items?: ImportItem[] }>().catch(() => null);
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return c.json({ error: "가져올 항목이 없습니다." }, 400);
  }
  const validCategories: Category[] = ["homework", "supplies", "exam", "event", "notice", "other"];

  const statements = [];
  for (const item of body.items) {
    if (typeof item.title !== "string" || item.title.trim().length === 0) continue;
    const category = validCategories.includes(item.category) ? item.category : "other";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : todayStr();
    const points = typeof item.points === "number" && item.points >= 0 ? Math.floor(item.points) : 0;
    const memo = typeof item.memo === "string" && item.memo ? item.memo : null;
    statements.push(
      c.env.DB.prepare(
        `INSERT INTO tasks (id, title, category, repeat_type, repeat_config, start_date, end_date, points, memo, source, active)
         VALUES (?1, ?2, ?3, 'once', '{}', ?4, ?4, ?5, ?6, 'notice_import', 1)`,
      ).bind(newId(), item.title.trim(), category, date, points, memo),
    );
  }

  if (statements.length === 0) return c.json({ error: "유효한 항목이 없습니다." }, 400);
  await c.env.DB.batch(statements);
  return c.json({ ok: true, imported: statements.length });
});

export default notices;

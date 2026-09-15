import { Hono } from "hono";
import type { AppEnv, RewardRow, RedemptionRow } from "../types";
import { requireAuth, requireDad } from "../lib/auth";
import { newId, getPointsBalance } from "../lib/db";

const rewards = new Hono<AppEnv>();

rewards.get("/", requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT * FROM rewards WHERE active = 1 ORDER BY cost_points ASC`).all<RewardRow>();
  const balance = await getPointsBalance(c.env.DB);
  return c.json({ rewards: results, balance });
});

rewards.get("/history", requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT * FROM redemptions ORDER BY redeemed_at DESC LIMIT 50`).all<RedemptionRow>();
  return c.json({ history: results });
});

rewards.get("/redemptions/pending", requireDad, async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT * FROM redemptions WHERE status = 'pending' ORDER BY redeemed_at ASC`).all<RedemptionRow>();
  return c.json({ pending: results });
});

rewards.post("/", requireDad, async (c) => {
  const body = await c.req.json<{ title?: string; costPoints?: number; icon?: string }>().catch(() => null);
  if (!body || typeof body.title !== "string" || body.title.trim().length === 0) {
    return c.json({ error: "보상 이름을 입력해주세요." }, 400);
  }
  if (typeof body.costPoints !== "number" || body.costPoints <= 0) {
    return c.json({ error: "포인트는 1 이상이어야 합니다." }, 400);
  }
  const id = newId();
  await c.env.DB.prepare(`INSERT INTO rewards (id, title, cost_points, icon, active) VALUES (?1, ?2, ?3, ?4, 1)`)
    .bind(id, body.title.trim(), Math.floor(body.costPoints), body.icon && body.icon.length <= 4 ? body.icon : "🎁")
    .run();
  return c.json({ ok: true, id });
});

rewards.put("/:id", requireDad, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ title?: string; costPoints?: number; icon?: string }>().catch(() => null);
  if (!body || typeof body.title !== "string" || body.title.trim().length === 0) {
    return c.json({ error: "보상 이름을 입력해주세요." }, 400);
  }
  if (typeof body.costPoints !== "number" || body.costPoints <= 0) {
    return c.json({ error: "포인트는 1 이상이어야 합니다." }, 400);
  }
  await c.env.DB.prepare(`UPDATE rewards SET title=?2, cost_points=?3, icon=?4 WHERE id=?1`)
    .bind(id, body.title.trim(), Math.floor(body.costPoints), body.icon && body.icon.length <= 4 ? body.icon : "🎁")
    .run();
  return c.json({ ok: true });
});

rewards.delete("/:id", requireDad, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare(`UPDATE rewards SET active = 0 WHERE id = ?1`).bind(id).run();
  return c.json({ ok: true });
});

rewards.post("/:id/redeem", requireAuth, async (c) => {
  const id = c.req.param("id");
  const reward = await c.env.DB.prepare(`SELECT * FROM rewards WHERE id = ?1 AND active = 1`).bind(id).first<RewardRow>();
  if (!reward) return c.json({ error: "보상을 찾을 수 없습니다." }, 404);

  const balance = await getPointsBalance(c.env.DB);
  if (balance < reward.cost_points) {
    return c.json({ error: "포인트가 부족해요." }, 400);
  }

  // 포인트는 신청 시점에 바로 차감(예약)되고, 아빠가 승인/거절하면 확정/환불됩니다.
  await c.env.DB.prepare(
    `INSERT INTO redemptions (id, reward_id, reward_title, points_spent, status) VALUES (?1, ?2, ?3, ?4, 'pending')`,
  )
    .bind(newId(), reward.id, reward.title, reward.cost_points)
    .run();

  const newBalance = balance - reward.cost_points;
  return c.json({ ok: true, balance: newBalance, status: "pending" });
});

rewards.post("/redemptions/:redemptionId/approve", requireDad, async (c) => {
  const redemptionId = c.req.param("redemptionId");
  const redemption = await c.env.DB.prepare(`SELECT * FROM redemptions WHERE id = ?1 AND status = 'pending'`)
    .bind(redemptionId)
    .first<RedemptionRow>();
  if (!redemption) return c.json({ error: "승인 대기 중인 신청을 찾을 수 없습니다." }, 404);

  await c.env.DB.prepare(`UPDATE redemptions SET status = 'fulfilled', resolved_at = datetime('now') WHERE id = ?1`)
    .bind(redemptionId)
    .run();

  return c.json({ ok: true });
});

rewards.post("/redemptions/:redemptionId/reject", requireDad, async (c) => {
  const redemptionId = c.req.param("redemptionId");
  const redemption = await c.env.DB.prepare(`SELECT * FROM redemptions WHERE id = ?1 AND status = 'pending'`)
    .bind(redemptionId)
    .first<RedemptionRow>();
  if (!redemption) return c.json({ error: "승인 대기 중인 신청을 찾을 수 없습니다." }, 404);

  // 거절하면 예약해둔 포인트를 돌려줍니다 (status가 'rejected'이면 잔액 계산에서 제외됨).
  await c.env.DB.prepare(`UPDATE redemptions SET status = 'rejected', resolved_at = datetime('now') WHERE id = ?1`)
    .bind(redemptionId)
    .run();

  return c.json({ ok: true });
});

export default rewards;

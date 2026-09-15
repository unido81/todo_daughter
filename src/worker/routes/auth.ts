import { Hono } from "hono";
import type { AppEnv, Role } from "../types";
import { createSession, clearSession, getRole } from "../lib/auth";
import { isLoginLocked, recordLoginFailure, resetLoginAttempts } from "../lib/rateLimit";

const auth = new Hono<AppEnv>();

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

auth.post("/login", async (c) => {
  const body = await c.req.json<{ role: Role; password: string }>().catch(() => null);
  if (!body || (body.role !== "dad" && body.role !== "daughter") || typeof body.password !== "string") {
    return c.json({ error: "요청 형식이 올바르지 않습니다." }, 400);
  }
  const lockState = await isLoginLocked(c.env.DB, body.role);
  if (lockState.locked) {
    return c.json({ error: `너무 많이 틀렸어요. ${lockState.retryAfterMinutes}분 후 다시 시도해주세요.` }, 429);
  }

  const expected = body.role === "dad" ? c.env.DAD_PASSWORD : c.env.DAUGHTER_PASSWORD;
  if (!expected || !timingSafeEqual(body.password, expected)) {
    await recordLoginFailure(c.env.DB, body.role);
    return c.json({ error: "비밀번호가 올바르지 않습니다." }, 401);
  }

  await resetLoginAttempts(c.env.DB, body.role);
  await createSession(c, body.role);
  return c.json({ ok: true, role: body.role });
});

auth.post("/logout", async (c) => {
  clearSession(c);
  return c.json({ ok: true });
});

auth.get("/me", async (c) => {
  const role = await getRole(c);
  if (!role) return c.json({ role: null }, 200);
  return c.json({ role });
});

export default auth;

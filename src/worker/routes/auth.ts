import { Hono } from "hono";
import type { AppEnv, Role } from "../types";
import { createSession, clearSession, getRole } from "../lib/auth";

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
  const expected = body.role === "dad" ? c.env.DAD_PASSWORD : c.env.DAUGHTER_PASSWORD;
  if (!expected || !timingSafeEqual(body.password, expected)) {
    return c.json({ error: "비밀번호가 올바르지 않습니다." }, 401);
  }
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

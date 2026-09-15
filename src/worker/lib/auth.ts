import { sign, verify } from "hono/jwt";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context, Next } from "hono";
import type { AppEnv, Role } from "../types";

const COOKIE_NAME = "td_session";
const SESSION_HOURS = 24 * 14; // 2 weeks

type AppContext = Context<AppEnv>;

export async function createSession(c: AppContext, role: Role) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const token = await sign({ role, exp }, c.env.JWT_SECRET);
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export function clearSession(c: AppContext) {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

export async function getRole(c: AppContext): Promise<Role | null> {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;
  try {
    const payload = await verify(token, c.env.JWT_SECRET, "HS256");
    const role = payload.role;
    if (role === "dad" || role === "daughter") return role;
    return null;
  } catch {
    return null;
  }
}

export async function requireAuth(c: AppContext, next: Next) {
  const role = await getRole(c);
  if (!role) return c.json({ error: "로그인이 필요합니다." }, 401);
  c.set("role", role);
  await next();
}

export async function requireDad(c: AppContext, next: Next) {
  const role = await getRole(c);
  if (!role) return c.json({ error: "로그인이 필요합니다." }, 401);
  if (role !== "dad") return c.json({ error: "아빠 계정만 사용할 수 있어요." }, 403);
  c.set("role", role);
  await next();
}

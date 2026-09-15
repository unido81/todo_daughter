import { Hono } from "hono";
import type { AppEnv } from "./types";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import noticeRoutes from "./routes/notices";
import rewardRoutes from "./routes/rewards";
import { requireAuth } from "./lib/auth";
import { getPointsBalance } from "./lib/db";

const app = new Hono<AppEnv>();

app.route("/api/auth", authRoutes);
app.route("/api/tasks", taskRoutes);
app.route("/api/notices", noticeRoutes);
app.route("/api/rewards", rewardRoutes);

app.get("/api/points/balance", requireAuth, async (c) => {
  const balance = await getPointsBalance(c.env.DB);
  return c.json({ balance });
});

app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) return c.json({ error: "Not found" }, 404);
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;

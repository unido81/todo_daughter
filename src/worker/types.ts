export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  DAD_PASSWORD: string;
  DAUGHTER_PASSWORD: string;
}

export type Role = "dad" | "daughter";

export type AppEnv = { Bindings: Env; Variables: { role: Role } };

export type Category = "homework" | "supplies" | "exam" | "event" | "other";

export type RepeatType = "once" | "daily" | "weekly" | "monthly";

export interface WeeklyConfig {
  weekdays: number[]; // 0 (Sun) - 6 (Sat)
}

export interface MonthlyConfig {
  dayOfMonth: number; // 1-31
}

export type RepeatConfig = WeeklyConfig | MonthlyConfig | Record<string, never>;

export interface TaskRow {
  id: string;
  title: string;
  category: Category;
  repeat_type: RepeatType;
  repeat_config: string;
  start_date: string;
  end_date: string | null;
  points: number;
  memo: string | null;
  source: string;
  active: number;
  created_at: string;
}

export interface CompletionRow {
  id: string;
  task_id: string;
  occurrence_date: string;
  completed_at: string;
  points_awarded: number;
}

export interface RewardRow {
  id: string;
  title: string;
  cost_points: number;
  icon: string;
  active: number;
  created_at: string;
}

export interface RedemptionRow {
  id: string;
  reward_id: string;
  reward_title: string;
  points_spent: number;
  status: "pending" | "approved" | "fulfilled" | "rejected";
  redeemed_at: string;
  resolved_at: string | null;
}

export const CATEGORY_LABELS: Record<Category, { label: string; color: string; emoji: string }> = {
  homework: { label: "숙제", color: "rose", emoji: "📝" },
  supplies: { label: "준비물", color: "amber", emoji: "🎒" },
  exam: { label: "시험", color: "red", emoji: "✏️" },
  event: { label: "행사", color: "emerald", emoji: "🎪" },
  other: { label: "기타", color: "sky", emoji: "📌" },
};

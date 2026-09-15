export type Role = "dad" | "daughter";

export type Category = "homework" | "supplies" | "exam" | "event" | "other";

export type RepeatType = "once" | "daily" | "weekly" | "monthly";

export interface Occurrence {
  date: string;
  completed: boolean;
}

export interface TaskDto {
  id: string;
  title: string;
  category: Category;
  repeatType: RepeatType;
  repeatConfig: { weekdays?: number[]; dayOfMonth?: number };
  startDate: string;
  endDate: string | null;
  points: number;
  memo: string | null;
  source: string;
  occurrences: Occurrence[];
}

export interface RewardDto {
  id: string;
  title: string;
  cost_points: number;
  icon: string;
  active: number;
  created_at: string;
}

export interface RedemptionDto {
  id: string;
  reward_id: string;
  reward_title: string;
  points_spent: number;
  status: string;
  redeemed_at: string;
}

export interface TaskPayload {
  title: string;
  category: Category;
  repeatType: RepeatType;
  repeatConfig: { weekdays?: number[]; dayOfMonth?: number };
  startDate: string;
  endDate: string | null;
  points: number;
  memo: string | null;
}

export interface ClassifiedItemDto {
  title: string;
  category: Category;
  suggestedDate: string | null;
  raw: string;
}

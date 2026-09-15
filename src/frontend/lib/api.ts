import type { ClassifiedItemDto, RedemptionDto, RewardDto, Role, TaskDto, TaskPayload } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `요청에 실패했어요. (${res.status})`);
  }
  return data as T;
}

export const api = {
  me: () => request<{ role: Role | null }>("/auth/me"),
  login: (role: Role, password: string) =>
    request<{ ok: true; role: Role }>("/auth/login", { method: "POST", body: JSON.stringify({ role, password }) }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),

  tasks: (month: string) => request<{ month: string; tasks: TaskDto[] }>(`/tasks?month=${month}`),
  createTask: (payload: TaskPayload) =>
    request<{ ok: true; id: string }>("/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id: string, payload: TaskPayload) =>
    request<{ ok: true }>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteTask: (id: string) => request<{ ok: true }>(`/tasks/${id}`, { method: "DELETE" }),
  completeTask: (id: string, date: string) =>
    request<{ ok: true; pointsAwarded?: number }>(`/tasks/${id}/complete`, { method: "POST", body: JSON.stringify({ date }) }),
  uncompleteTask: (id: string, date: string) =>
    request<{ ok: true }>(`/tasks/${id}/uncomplete`, { method: "POST", body: JSON.stringify({ date }) }),

  classifyNotice: (text: string) => request<{ items: ClassifiedItemDto[] }>("/notices/classify", { method: "POST", body: JSON.stringify({ text }) }),
  importNotice: (items: unknown[]) =>
    request<{ ok: true; imported: number }>("/notices/import", { method: "POST", body: JSON.stringify({ items }) }),

  rewards: () => request<{ rewards: RewardDto[]; balance: number }>("/rewards"),
  rewardHistory: () => request<{ history: RedemptionDto[] }>("/rewards/history"),
  createReward: (payload: { title: string; costPoints: number; icon: string }) =>
    request<{ ok: true; id: string }>("/rewards", { method: "POST", body: JSON.stringify(payload) }),
  updateReward: (id: string, payload: { title: string; costPoints: number; icon: string }) =>
    request<{ ok: true }>(`/rewards/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteReward: (id: string) => request<{ ok: true }>(`/rewards/${id}`, { method: "DELETE" }),
  redeemReward: (id: string) => request<{ ok: true; balance: number }>(`/rewards/${id}/redeem`, { method: "POST" }),

  pointsBalance: () => request<{ balance: number }>("/points/balance"),
};

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { RedemptionDto, RewardDto } from "../lib/types";
import PointsBadge from "./PointsBadge";

const EMOJI_CHOICES = ["🎁", "🍭", "🍦", "🎮", "📱", "🎬", "🧸", "🚲", "💰", "🍕"];

export default function RewardManager() {
  const [rewards, setRewards] = useState<RewardDto[]>([]);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<RedemptionDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(10);
  const [icon, setIcon] = useState("🎁");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [r, h] = await Promise.all([api.rewards(), api.rewardHistory()]);
      setRewards(r.rewards);
      setBalance(r.balance);
      setHistory(h.history);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setTitle("");
    setCost(10);
    setIcon("🎁");
    setEditingId(null);
  }

  function startEdit(r: RewardDto) {
    setEditingId(r.id);
    setTitle(r.title);
    setCost(r.cost_points);
    setIcon(r.icon);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length === 0) return setError("보상 이름을 입력해주세요.");
    if (cost <= 0) return setError("포인트는 1 이상이어야 해요.");
    setSaving(true);
    try {
      if (editingId) {
        await api.updateReward(editingId, { title: title.trim(), costPoints: cost, icon });
      } else {
        await api.createReward({ title: title.trim(), costPoints: cost, icon });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.deleteReward(id);
    if (editingId === id) resetForm();
    load();
  }

  if (loading) return <div className="card p-6 text-center text-black/40">불러오는 중...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">보상 관리</h2>
        <PointsBadge balance={balance} />
      </div>

      <form onSubmit={handleSubmit} className="card p-4 space-y-3">
        <div className="text-sm font-semibold">{editingId ? "보상 수정" : "새 보상 추가"}</div>
        <div className="flex gap-1.5 flex-wrap">
          {EMOJI_CHOICES.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setIcon(e)}
              className={`w-9 h-9 rounded-xl text-lg border ${icon === e ? "border-ink bg-black/5" : "border-black/10"}`}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 아이스크림 사주기"
          className="w-full rounded-2xl border border-black/10 px-4 py-2.5 outline-none text-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-black/40">필요 포인트</span>
          <input
            type="number"
            min={1}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className="w-24 rounded-2xl border border-black/10 px-3 py-2 outline-none text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          {editingId && (
            <button type="button" onClick={resetForm} className="flex-1 py-2.5 rounded-2xl bg-black/5 text-black/60 text-sm font-semibold">
              취소
            </button>
          )}
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-2xl bg-ink text-white text-sm font-semibold disabled:opacity-40">
            {saving ? "저장 중..." : editingId ? "수정하기" : "추가하기"}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {rewards.map((r) => (
          <div key={r.id} className="card p-3 flex items-center gap-3">
            <div className="text-2xl">{r.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{r.title}</div>
              <div className="text-xs text-amber-600 font-bold">⭐ {r.cost_points}P</div>
            </div>
            <button onClick={() => startEdit(r)} className="w-8 h-8 rounded-full bg-black/5 text-black/50 text-sm">
              ✎
            </button>
            <button onClick={() => handleDelete(r.id)} className="w-8 h-8 rounded-full bg-black/5 text-black/50 text-sm">
              ✕
            </button>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2 px-1">교환 내역</h3>
          <div className="space-y-1.5">
            {history.map((h) => (
              <div key={h.id} className="card px-4 py-2.5 flex items-center justify-between text-sm">
                <span>{h.reward_title}</span>
                <span className="text-black/40 text-xs">
                  -{h.points_spent}P · {h.redeemed_at.slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

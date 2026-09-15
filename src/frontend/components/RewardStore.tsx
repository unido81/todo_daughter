import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { RewardDto } from "../lib/types";
import PointsBadge from "./PointsBadge";

export default function RewardStore() {
  const [rewards, setRewards] = useState<RewardDto[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.rewards();
      setRewards(res.rewards);
      setBalance(res.balance);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRedeem(reward: RewardDto) {
    setRedeemingId(reward.id);
    setMessage(null);
    try {
      const res = await api.redeemReward(reward.id);
      setBalance(res.balance);
      setMessage(`"${reward.title}" 보상을 받았어요! 아빠에게 알려주세요 🎉`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "교환에 실패했어요.");
    } finally {
      setRedeemingId(null);
    }
  }

  if (loading) return <div className="card p-6 text-center text-black/40">불러오는 중...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">보상 상점</h2>
        <PointsBadge balance={balance} />
      </div>

      {message && <div className="card p-3 text-sm text-center bg-emerald-50 border-emerald-100">{message}</div>}

      {rewards.length === 0 ? (
        <div className="card p-6 text-center text-black/40 text-sm">아직 등록된 보상이 없어요. 아빠에게 이야기해보세요!</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rewards.map((r) => {
            const canAfford = balance >= r.cost_points;
            return (
              <div key={r.id} className="card p-4 flex flex-col items-center text-center gap-2">
                <div className="text-3xl">{r.icon}</div>
                <div className="font-semibold text-sm">{r.title}</div>
                <div className="text-xs text-amber-600 font-bold">⭐ {r.cost_points}P</div>
                <button
                  onClick={() => handleRedeem(r)}
                  disabled={!canAfford || redeemingId === r.id}
                  className={`mt-1 w-full py-2 rounded-xl text-sm font-semibold ${
                    canAfford ? "bg-ink text-white" : "bg-black/5 text-black/30"
                  }`}
                >
                  {redeemingId === r.id ? "..." : canAfford ? "교환하기" : "포인트 부족"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

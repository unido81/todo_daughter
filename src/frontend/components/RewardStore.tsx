import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { RedemptionDto, RewardDto } from "../lib/types";
import { REDEMPTION_STATUS_META } from "../lib/reward";
import Face from "./Face";

const CARD_COLORS = ["bg-mint", "bg-coral-soft", "bg-grape-soft", "bg-lemon", "bg-bubble-soft", "bg-aqua-soft"];

export default function RewardStore() {
  const [rewards, setRewards] = useState<RewardDto[]>([]);
  const [history, setHistory] = useState<RedemptionDto[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  async function handleRedeem(reward: RewardDto) {
    setRedeemingId(reward.id);
    setMessage(null);
    try {
      const res = await api.redeemReward(reward.id);
      setBalance(res.balance);
      setMessage(`"${reward.title}" 교환을 신청했어요. 아빠가 승인하면 받을 수 있어요! 🙋`);
      const h = await api.rewardHistory();
      setHistory(h.history);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "교환에 실패했어요.");
    } finally {
      setRedeemingId(null);
    }
  }

  if (loading) return <div className="card p-8 text-center font-bold text-ink/30">불러오는 중...</div>;

  return (
    <div className="space-y-3.5">
      <h2 className="text-[1.75rem] leading-tight font-black tracking-tight pt-1 px-1">
        포인트로
        <br />
        바꿔볼까?
      </h2>

      {message && (
        <div className="tile bg-mint-soft text-sm font-bold text-center text-mint-deep">{message}</div>
      )}

      {rewards.length === 0 ? (
        <div className="card p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-lemon border-2 border-ink/10 flex items-center justify-center text-ink">
            <Face expression="sleepy" className="w-9 h-9" />
          </div>
          <p className="font-bold text-ink/50">아직 보상이 없어요.
            <br />
            아빠에게 이야기해보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rewards.map((r, i) => {
            const canAfford = balance >= r.cost_points;
            return (
              <div
                key={r.id}
                className={`tile flex flex-col items-center text-center gap-1.5 ${CARD_COLORS[i % CARD_COLORS.length]} ${
                  canAfford ? "" : "opacity-60"
                }`}
              >
                <div className="text-4xl">{r.icon}</div>
                <div className="font-extrabold text-sm leading-tight">{r.title}</div>
                <div className="text-xs font-black bg-white/70 border-2 border-ink/10 rounded-full px-2.5 py-0.5">
                  ⭐ {r.cost_points}P
                </div>
                <button
                  onClick={() => handleRedeem(r)}
                  disabled={!canAfford || redeemingId === r.id}
                  className={`mt-1 w-full py-2.5 rounded-2xl text-sm font-black border-2 transition active:translate-y-0.5 ${
                    canAfford ? "bg-ink text-white border-ink" : "bg-white/60 text-ink/30 border-ink/10"
                  }`}
                >
                  {redeemingId === r.id ? "..." : canAfford ? "교환 신청" : `${r.cost_points - balance}P 더!`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-1">
          <h3 className="font-black text-sm mb-2 px-1">내 교환 신청 내역</h3>
          <div className="space-y-2">
            {history.map((h) => {
              const meta = REDEMPTION_STATUS_META[h.status] ?? REDEMPTION_STATUS_META.pending;
              return (
                <div key={h.id} className="card px-4 py-3 flex items-center justify-between text-sm gap-2">
                  <span className="truncate font-bold">{h.reward_title}</span>
                  <span className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

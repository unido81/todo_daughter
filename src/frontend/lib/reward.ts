export const REDEMPTION_STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "승인 대기중", className: "bg-lemon-soft text-lemon-deep border-2 border-lemon" },
  fulfilled: { label: "받았어요", className: "bg-mint-soft text-mint-deep border-2 border-mint" },
  rejected: { label: "거절됨", className: "bg-lilac text-ink/40 border-2 border-ink/10" },
};

export const REDEMPTION_STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "승인 대기중", className: "bg-amber-100 text-amber-700 border border-amber-200" },
  fulfilled: { label: "받았어요", className: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  rejected: { label: "거절됨", className: "bg-black/5 text-black/40 border border-black/10" },
};

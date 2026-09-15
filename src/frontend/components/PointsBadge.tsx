export default function PointsBadge({ balance }: { balance: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-lemon text-ink border-2 border-ink/10 rounded-full px-3.5 py-2 font-black text-sm">
      <span>⭐</span>
      <span>{balance}P</span>
    </div>
  );
}

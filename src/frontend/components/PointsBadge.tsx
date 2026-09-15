export default function PointsBadge({ balance }: { balance: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-3 py-1.5 font-bold text-sm">
      <span>⭐</span>
      <span>{balance}P</span>
    </div>
  );
}

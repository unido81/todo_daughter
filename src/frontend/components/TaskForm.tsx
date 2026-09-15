import { useState } from "react";
import type { Category, RepeatType, TaskDto, TaskPayload } from "../lib/types";
import { CATEGORY_META, CATEGORY_ORDER, categorySolidClass } from "../lib/category";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TaskForm({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial?: TaskDto;
  onSave: (value: TaskPayload) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "homework");
  const [repeatType, setRepeatType] = useState<RepeatType>(initial?.repeatType ?? "once");
  const [weekdays, setWeekdays] = useState<number[]>(initial?.repeatConfig.weekdays ?? []);
  const [dayOfMonth, setDayOfMonth] = useState<number>(initial?.repeatConfig.dayOfMonth ?? 1);
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayStr());
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [points, setPoints] = useState(initial?.points ?? 0);
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length === 0) return setError("제목을 입력해주세요.");
    if (repeatType === "weekly" && weekdays.length === 0) return setError("요일을 하나 이상 선택해주세요.");

    const repeatConfig = repeatType === "weekly" ? { weekdays } : repeatType === "monthly" ? { dayOfMonth } : {};

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        category,
        repeatType,
        repeatConfig,
        startDate,
        endDate: endDate || null,
        points: Number(points) || 0,
        memo: memo || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center z-20 px-0 sm:px-4">
      <div className="bg-white rounded-t-blob sm:rounded-blob w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-6 border-2 border-ink/10">
        <h2 className="text-2xl font-black tracking-tight mb-4">{initial ? "할일 수정" : "새 할일"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black text-ink/40 mb-1.5 block">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl bg-lilac-soft border-2 border-ink/10 px-4 py-3 font-semibold outline-none focus:border-grape transition"
              placeholder="예: 수학 익힘책 풀기"
            />
          </div>

          <div>
            <label className="text-xs font-black text-ink/40 mb-1.5 block">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ORDER.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition ${
                    category === c ? categorySolidClass(c) : "border-ink/10 text-ink/40"
                  }`}
                >
                  {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-ink/40 mb-1.5 block">반복</label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { key: "once", label: "한 번" },
                  { key: "daily", label: "매일" },
                  { key: "weekly", label: "매주" },
                  { key: "monthly", label: "매월" },
                ] as { key: RepeatType; label: string }[]
              ).map((r) => (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => setRepeatType(r.key)}
                  className={`py-2.5 rounded-2xl text-sm font-bold border-2 transition ${
                    repeatType === r.key ? "bg-ink text-white border-ink" : "border-ink/10 text-ink/40"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {repeatType === "weekly" && (
            <div>
              <label className="text-xs font-black text-ink/40 mb-1.5 block">요일 선택</label>
              <div className="flex gap-1.5">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => toggleWeekday(idx)}
                    className={`w-9 h-9 rounded-full text-sm font-bold border-2 transition ${
                      weekdays.includes(idx) ? "bg-ink text-white border-ink" : "border-ink/10 text-ink/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {repeatType === "monthly" && (
            <div>
              <label className="text-xs font-black text-ink/40 mb-1.5 block">매월 며칠</label>
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-24 rounded-2xl bg-lilac-soft border-2 border-ink/10 px-4 py-3 font-semibold outline-none focus:border-grape transition"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-ink/40 mb-1.5 block">{repeatType === "once" ? "날짜" : "시작일"}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl bg-lilac-soft border-2 border-ink/10 px-3 py-3 font-semibold outline-none focus:border-grape transition"
              />
            </div>
            {repeatType !== "once" && (
              <div>
                <label className="text-xs font-black text-ink/40 mb-1.5 block">종료일 (선택)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-2xl bg-lilac-soft border-2 border-ink/10 px-3 py-3 font-semibold outline-none focus:border-grape transition"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-black text-ink/40 mb-1.5 block">완료 보상 포인트</label>
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-28 rounded-2xl bg-lemon-soft border-2 border-lemon px-4 py-3 font-black outline-none focus:border-grape transition"
            />
          </div>

          <div>
            <label className="text-xs font-black text-ink/40 mb-1.5 block">메모 (선택)</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="w-full rounded-2xl bg-lilac-soft border-2 border-ink/10 px-4 py-3 font-semibold outline-none focus:border-grape transition resize-none"
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-bubble-deep bg-bubble-soft border-2 border-bubble rounded-2xl px-4 py-2.5">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-2xl bg-lilac border-2 border-ink/10 text-ink/50 font-black active:translate-y-0.5 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3.5 rounded-2xl bg-ink text-white font-black disabled:opacity-30 active:translate-y-0.5 transition"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
          {onDelete && (
            <button type="button" onClick={onDelete} className="w-full text-center text-sm font-bold text-bubble-deep pt-1">
              이 할일 삭제하기
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

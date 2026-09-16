import { useMemo, useState } from "react";
import { api } from "../lib/api";
import type { Category } from "../lib/types";
import { CATEGORY_META, CATEGORY_ORDER, categoryChipClass } from "../lib/category";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 아빠가 매번 포인트를 입력하지 않아도 되도록 분류별 기본값을 깔아둔다. */
const DEFAULT_POINTS: Record<Category, number> = {
  homework: 10,
  exam: 10,
  supplies: 5,
  event: 5,
  notice: 0,
  other: 0,
};

interface ReviewItem {
  include: boolean;
  title: string;
  category: Category;
  date: string;
  points: number;
  lowConfidence: boolean;
}

const PLACEHOLDER = `예)
1. 사회 체육 미술
2. 수익 46-47쪽
3. 사람조심 차조심 환절기 감기조심
4. 금요일 송편만들기 있음. 모두 개인 도시락 꼭 가져오기`;

export default function NoticeImport({ onImported }: { onImported: () => void }) {
  const [text, setText] = useState("");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [classifying, setClassifying] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const summary = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const item of items) {
      if (!item.include) continue;
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return CATEGORY_ORDER.filter((c) => counts.has(c)).map((c) => ({ category: c, count: counts.get(c)! }));
  }, [items]);

  const selectedCount = items.filter((i) => i.include).length;

  async function handleClassify() {
    if (text.trim().length === 0) return;
    setClassifying(true);
    setMessage(null);
    try {
      const res = await api.classifyNotice(text);
      setItems(
        res.items.map((it) => ({
          include: !it.lowConfidence,
          title: it.title,
          category: it.category,
          date: it.suggestedDate ?? todayStr(),
          points: DEFAULT_POINTS[it.category] ?? 0,
          lowConfidence: it.lowConfidence,
        })),
      );
      if (res.items.length === 0) setMessage("항목을 찾지 못했어요. 알림장 내용을 확인해주세요.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "분류에 실패했어요.");
    } finally {
      setClassifying(false);
    }
  }

  function updateItem(idx: number, patch: Partial<ReviewItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function handleImport() {
    const selected = items.filter((it) => it.include && it.title.trim().length > 0);
    if (selected.length === 0) return;
    setImporting(true);
    setMessage(null);
    try {
      const res = await api.importNotice(selected);
      setMessage(`${res.imported}개를 딸 할일판에 올렸어요!`);
      setItems([]);
      setText("");
      onImported();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "가져오기에 실패했어요.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-3.5">
      <h2 className="text-[1.75rem] leading-tight font-black tracking-tight pt-1 px-1">
        알림장,
        <br />
        붙여넣기만 하세요
      </h2>

      <div className="card p-4">
        <label className="text-xs font-black text-ink/40 mb-1.5 block">하이클래스 알림장 내용을 복사해서 붙여넣으세요</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder={PLACEHOLDER}
          className="w-full rounded-2xl bg-lilac-soft border-2 border-ink/10 px-4 py-3 text-sm font-semibold outline-none focus:border-grape transition resize-none"
        />
        <button
          onClick={handleClassify}
          disabled={classifying || text.trim().length === 0}
          className="mt-3 w-full py-3.5 rounded-blob bg-ink text-white font-black disabled:opacity-30 active:translate-y-0.5 transition"
        >
          {classifying ? "분류하는 중..." : "자동으로 분류하기"}
        </button>
        <p className="text-[11px] font-bold text-ink/30 mt-2.5 leading-relaxed">
          숙제 · 준비물 · 시험 · 행사 · 전달사항으로 나눠서 보여드려요. 자동 분류는 초안이라 등록 전에 꼭 확인해주세요.
        </p>
      </div>

      {message && <div className="tile bg-mint-soft text-sm font-bold text-center text-mint-deep">{message}</div>}

      {items.length > 0 && (
        <>
          <div className="tile bg-white flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-black text-ink/40 mr-1">등록될 항목</span>
            {summary.length === 0 ? (
              <span className="text-xs font-bold text-ink/30">선택된 항목 없음</span>
            ) : (
              summary.map(({ category, count }) => (
                <span key={category} className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${categoryChipClass(category)}`}>
                  {CATEGORY_META[category].emoji} {CATEGORY_META[category].label} {count}
                </span>
              ))
            )}
          </div>

          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div key={idx} className={`card p-3.5 space-y-2.5 transition ${item.include ? "" : "opacity-45"}`}>
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => updateItem(idx, { include: !item.include })}
                    className={`w-9 h-9 flex-shrink-0 rounded-xl border-2 font-black transition ${
                      item.include ? "bg-mint border-ink/10 text-ink" : "bg-lilac-soft border-dashed border-ink/20 text-transparent"
                    }`}
                    aria-label={item.include ? "등록 제외하기" : "등록에 포함하기"}
                  >
                    ✓
                  </button>
                  <input
                    value={item.title}
                    onChange={(e) => updateItem(idx, { title: e.target.value })}
                    className="flex-1 min-w-0 rounded-xl bg-lilac-soft border-2 border-ink/10 px-3 py-2 text-sm font-semibold outline-none focus:border-grape transition"
                  />
                </div>

                {item.lowConfidence && (
                  <div className="pl-11 text-[11px] font-bold text-ink/35">
                    시간표로 보여서 기본 제외했어요. 챙길 게 있으면 체크해주세요.
                  </div>
                )}

                <div className="flex items-center gap-1.5 flex-wrap pl-11">
                  <select
                    value={item.category}
                    onChange={(e) => {
                      const category = e.target.value as Category;
                      updateItem(idx, { category, points: DEFAULT_POINTS[category] ?? 0 });
                    }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold outline-none ${categoryChipClass(item.category)}`}
                  >
                    {CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateItem(idx, { date: e.target.value })}
                    className="rounded-full bg-lilac border-2 border-ink/10 px-2.5 py-1 text-[11px] font-bold outline-none"
                  />
                  <label className="flex items-center gap-1 rounded-full bg-lemon-soft border-2 border-lemon px-2.5 py-1">
                    <span className="text-[11px] font-bold">⭐</span>
                    <input
                      type="number"
                      min={0}
                      value={item.points}
                      onChange={(e) => updateItem(idx, { points: Number(e.target.value) })}
                      className="w-8 bg-transparent text-[11px] font-black outline-none"
                      aria-label="완료 보상 포인트"
                    />
                    <span className="text-[11px] font-bold">P</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={importing || selectedCount === 0}
            className="w-full py-4 rounded-blob bg-ink text-white font-black text-lg disabled:opacity-30 active:translate-y-0.5 transition"
          >
            {importing ? "등록하는 중..." : `${selectedCount}개 할일판에 올리기`}
          </button>
        </>
      )}
    </div>
  );
}

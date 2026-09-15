import { useState } from "react";
import { api } from "../lib/api";
import type { Category } from "../lib/types";
import { CATEGORY_META, CATEGORY_ORDER } from "../lib/category";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ReviewItem {
  include: boolean;
  title: string;
  category: Category;
  date: string;
  points: number;
}

export default function NoticeImport({ onImported }: { onImported: () => void }) {
  const [text, setText] = useState("");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [classifying, setClassifying] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClassify() {
    if (text.trim().length === 0) return;
    setClassifying(true);
    setMessage(null);
    try {
      const res = await api.classifyNotice(text);
      setItems(
        res.items.map((it) => ({
          include: true,
          title: it.title,
          category: it.category,
          date: it.suggestedDate ?? todayStr(),
          points: 0,
        })),
      );
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
      setMessage(`${res.imported}개의 할일을 등록했어요!`);
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
    <div className="space-y-3">
      <div className="card p-4">
        <label className="text-xs text-black/40 mb-1 block">하이클래스 알림장 내용을 복사해서 붙여넣으세요</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={"예)\n1. 국어 익힘책 32쪽 풀어오기\n2. 수학 준비물: 색종이, 가위\n3. 금요일 현장학습, 도시락 준비"}
          className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none resize-none text-sm"
        />
        <button
          onClick={handleClassify}
          disabled={classifying || text.trim().length === 0}
          className="mt-3 w-full py-3 rounded-2xl bg-ink text-white font-semibold disabled:opacity-40"
        >
          {classifying ? "분류하는 중..." : "자동 분류하기"}
        </button>
        <p className="text-xs text-black/30 mt-2">
          자동 분류는 초안이에요. 아래에서 카테고리와 날짜를 확인하고 필요하면 고쳐서 등록해주세요.
        </p>
      </div>

      {message && <div className="card p-3 text-sm text-center">{message}</div>}

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className={`card p-3 space-y-2 ${!item.include ? "opacity-40" : ""}`}>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={item.include}
                  onChange={(e) => updateItem(idx, { include: e.target.checked })}
                  className="mt-2.5"
                />
                <input
                  value={item.title}
                  onChange={(e) => updateItem(idx, { title: e.target.value })}
                  className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap pl-6">
                <select
                  value={item.category}
                  onChange={(e) => updateItem(idx, { category: e.target.value as Category })}
                  className="rounded-xl border border-black/10 px-2 py-1.5 text-xs outline-none"
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
                  className="rounded-xl border border-black/10 px-2 py-1.5 text-xs outline-none"
                />
                <input
                  type="number"
                  min={0}
                  value={item.points}
                  onChange={(e) => updateItem(idx, { points: Number(e.target.value) })}
                  className="w-16 rounded-xl border border-black/10 px-2 py-1.5 text-xs outline-none"
                  placeholder="포인트"
                />
              </div>
            </div>
          ))}

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-semibold disabled:opacity-40"
          >
            {importing ? "등록하는 중..." : `선택한 항목 할일로 등록하기 (${items.filter((i) => i.include).length}개)`}
          </button>
        </div>
      )}
    </div>
  );
}

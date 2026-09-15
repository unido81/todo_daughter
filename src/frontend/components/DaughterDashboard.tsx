import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { TaskDto } from "../lib/types";
import CalendarView from "./CalendarView";
import TaskList, { type OccurrenceItem } from "./TaskList";
import RewardStore from "./RewardStore";
import PointsBadge from "./PointsBadge";
import Face, { type Expression } from "./Face";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일 ${dow}요일`;
}

type Tab = "today" | "calendar" | "rewards";

const TABS: { key: Tab; label: string; icon: string; active: string }[] = [
  { key: "today", label: "오늘", icon: "✅", active: "bg-mint" },
  { key: "calendar", label: "달력", icon: "🗓️", active: "bg-grape" },
  { key: "rewards", label: "보상", icon: "🎁", active: "bg-lemon" },
];

function moodFor(rate: number): { expression: Expression; word: string; line: string } {
  if (rate >= 0.99) return { expression: "happy", word: "완벽해!", line: "할일을 하나도 안 빼놓고 다 했어요. 최고!" };
  if (rate >= 0.7) return { expression: "content", word: "잘하고 있어!", line: "거의 다 왔어요. 조금만 더 힘내볼까요?" };
  if (rate >= 0.3) return { expression: "neutral", word: "절반쯤!", line: "하나씩 체크하다 보면 금방 끝나요." };
  return { expression: "sleepy", word: "시작해볼까?", line: "제일 쉬운 것부터 하나만 해봐요." };
}

export default function DaughterDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("today");
  const [month, setMonth] = useState(todayStr().slice(0, 7));
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [balance, setBalance] = useState(0);

  async function loadMonth(m: string) {
    setLoading(true);
    try {
      const res = await api.tasks(m);
      setTasks(res.tasks);
    } finally {
      setLoading(false);
    }
  }

  async function loadBalance() {
    const res = await api.pointsBalance();
    setBalance(res.balance);
  }

  useEffect(() => {
    loadMonth(month);
  }, [month]);

  useEffect(() => {
    loadBalance();
  }, [tab]);

  const items: OccurrenceItem[] = useMemo(() => {
    const list: OccurrenceItem[] = [];
    for (const task of tasks) {
      for (const occ of task.occurrences) {
        if (occ.date === selectedDate) list.push({ task, date: occ.date, completed: occ.completed });
      }
    }
    return list.sort((a, b) => a.task.title.localeCompare(b.task.title));
  }, [tasks, selectedDate]);

  const todayStats = useMemo(() => {
    const today = todayStr();
    let scheduled = 0;
    let completed = 0;
    for (const task of tasks) {
      for (const occ of task.occurrences) {
        if (occ.date !== today) continue;
        scheduled += 1;
        if (occ.completed) completed += 1;
      }
    }
    return { scheduled, completed };
  }, [tasks]);

  const monthStats = useMemo(() => {
    let scheduled = 0;
    let completed = 0;
    for (const task of tasks) {
      for (const occ of task.occurrences) {
        scheduled += 1;
        if (occ.completed) completed += 1;
      }
    }
    const rate = scheduled === 0 ? 0 : completed / scheduled;
    return { scheduled, completed, percent: Math.round(rate * 100), rate };
  }, [tasks]);

  const mood = moodFor(todayStats.scheduled === 0 ? monthStats.rate : todayStats.completed / todayStats.scheduled);

  async function handleToggle(item: OccurrenceItem) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== item.task.id
          ? t
          : { ...t, occurrences: t.occurrences.map((o) => (o.date === item.date ? { ...o, completed: !item.completed } : o)) },
      ),
    );
    try {
      if (item.completed) {
        await api.uncompleteTask(item.task.id, item.date);
      } else {
        await api.completeTask(item.task.id, item.date);
      }
      loadBalance();
    } catch {
      loadMonth(month);
    }
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 bg-lilac/90 backdrop-blur z-10 px-5 pt-6 pb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-lilac-deep">{formatDateLabel(todayStr())}</div>
            <h1 className="text-xl font-black tracking-tight truncate">우리집 할일판</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PointsBadge balance={balance} />
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-full bg-white border-2 border-ink/10 text-xs font-bold text-ink/40"
              aria-label="로그아웃"
            >
              ↪
            </button>
          </div>
        </header>

        <main className="px-5 space-y-3.5">
          {tab === "today" && (
            <>
              <h2 className="text-[1.75rem] leading-tight font-black tracking-tight px-1 pt-1">
                {todayStats.scheduled === 0 ? (
                  <>오늘은 쉬는 날!</>
                ) : (
                  <>
                    오늘 할일 {todayStats.scheduled}개,
                    <br />
                    {todayStats.completed}개 끝냈어요!
                  </>
                )}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="tile bg-coral-soft">
                  <div className="text-[11px] font-black text-coral-deep">오늘 완료</div>
                  <div className="text-2xl font-black mt-2">
                    {todayStats.completed}
                    <span className="text-base text-ink/40">/{todayStats.scheduled}</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-white/70 overflow-hidden">
                    <div
                      className="h-full bg-coral rounded-full transition-all"
                      style={{
                        width: `${todayStats.scheduled === 0 ? 0 : (todayStats.completed / todayStats.scheduled) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="tile bg-grape-soft">
                  <div className="text-[11px] font-black text-grape-deep">모은 포인트</div>
                  <div className="text-2xl font-black mt-2">
                    {balance}
                    <span className="text-base text-ink/40">P</span>
                  </div>
                  <div className="text-[11px] font-bold text-ink/40 mt-2">상점에서 쓸 수 있어요</div>
                </div>
              </div>

              <div className="tile bg-mint">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-black text-mint-deep">이번 달 요약</div>
                    <div className="text-[1.6rem] leading-tight font-black mt-1">{mood.word}</div>
                    <p className="text-xs font-bold text-ink/55 mt-1.5">{mood.line}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/60 border-2 border-ink/10 flex items-center justify-center flex-shrink-0 text-ink">
                    <Face expression={mood.expression} className="w-9 h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t-2 border-ink/10">
                  <div>
                    <div className="text-lg font-black">{monthStats.completed}</div>
                    <div className="text-[10px] font-bold text-ink/45">완료한 할일</div>
                  </div>
                  <div>
                    <div className="text-lg font-black">{monthStats.percent}%</div>
                    <div className="text-[10px] font-bold text-ink/45">달성률</div>
                  </div>
                  <div>
                    <div className="text-lg font-black">{balance}P</div>
                    <div className="text-[10px] font-bold text-ink/45">모은 포인트</div>
                  </div>
                </div>
              </div>

              <div className="text-sm font-black px-1 pt-1">{formatDateLabel(selectedDate)} 할일</div>
              {loading ? (
                <div className="card p-8 text-center font-bold text-ink/30">불러오는 중...</div>
              ) : (
                <TaskList items={items} onToggle={handleToggle} />
              )}
            </>
          )}

          {tab === "calendar" && (
            <>
              <h2 className="text-[1.75rem] leading-tight font-black tracking-tight px-1 pt-1">
                내 한 달,
                <br />
                어떻게 보냈을까?
              </h2>
              <CalendarView
                month={month}
                onMonthChange={setMonth}
                tasks={tasks}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
              <div className="text-sm font-black px-1 pt-1">{formatDateLabel(selectedDate)} 할일</div>
              <TaskList items={items} onToggle={handleToggle} />
            </>
          )}

          {tab === "rewards" && <RewardStore />}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 tab-bar-safe px-4 pb-3 pointer-events-none">
        <div className="max-w-md mx-auto bg-white border-2 border-ink/10 rounded-blob p-1.5 grid grid-cols-3 gap-1 pointer-events-auto shadow-[0_6px_0_0_rgba(20,19,26,0.08)]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-2.5 rounded-[22px] flex flex-col items-center gap-0.5 text-[11px] font-black transition ${
                tab === t.key ? `${t.active} text-ink border-2 border-ink/10` : "text-ink/30"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

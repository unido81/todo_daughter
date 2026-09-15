import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { TaskDto } from "../lib/types";
import CalendarView from "./CalendarView";
import TaskList, { type OccurrenceItem } from "./TaskList";
import RewardStore from "./RewardStore";
import PointsBadge from "./PointsBadge";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

type Tab = "today" | "calendar" | "rewards";

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
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 bg-cream/90 backdrop-blur z-10 px-5 pt-6 pb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-black/40">안녕하세요 👋</div>
          <h1 className="text-xl font-bold">오늘도 화이팅!</h1>
        </div>
        <div className="flex items-center gap-2">
          <PointsBadge balance={balance} />
          <button onClick={onLogout} className="text-xs text-black/30 underline">
            로그아웃
          </button>
        </div>
      </header>

      <main className="px-5 space-y-4">
        {tab === "today" && (
          <>
            <div className="text-sm text-black/40 px-1">{selectedDate} 할일</div>
            {loading ? <div className="card p-6 text-center text-black/40">불러오는 중...</div> : <TaskList items={items} onToggle={handleToggle} />}
          </>
        )}

        {tab === "calendar" && (
          <>
            <CalendarView month={month} onMonthChange={setMonth} tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <div className="text-sm text-black/40 px-1">{selectedDate} 할일</div>
            <TaskList items={items} onToggle={handleToggle} />
          </>
        )}

        {tab === "rewards" && <RewardStore />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 tab-bar-safe">
        <div className="max-w-md mx-auto grid grid-cols-3">
          {(
            [
              { key: "today", label: "오늘", icon: "✅" },
              { key: "calendar", label: "달력", icon: "🗓️" },
              { key: "rewards", label: "보상", icon: "🎁" },
            ] as { key: Tab; label: string; icon: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-3 flex flex-col items-center gap-0.5 text-xs font-medium ${
                tab === t.key ? "text-ink" : "text-black/30"
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { TaskDto, TaskPayload } from "../lib/types";
import CalendarView from "./CalendarView";
import TaskList, { type OccurrenceItem } from "./TaskList";
import TaskForm from "./TaskForm";
import NoticeImport from "./NoticeImport";
import RewardManager from "./RewardManager";
import { compareForList } from "../lib/category";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

type Tab = "tasks" | "notice" | "rewards";

export default function DadDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [month, setMonth] = useState(todayStr().slice(0, 7));
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | undefined>(undefined);

  async function loadMonth(m: string) {
    setLoading(true);
    try {
      const res = await api.tasks(m);
      setTasks(res.tasks);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonth(month);
  }, [month]);

  const items: OccurrenceItem[] = useMemo(() => {
    const list: OccurrenceItem[] = [];
    for (const task of tasks) {
      for (const occ of task.occurrences) {
        if (occ.date === selectedDate) list.push({ task, date: occ.date, completed: occ.completed });
      }
    }
    return list.sort((a, b) => compareForList(a.task, b.task));
  }, [tasks, selectedDate]);

  function openCreate() {
    setEditingTask(undefined);
    setFormOpen(true);
  }

  function openEdit(task: TaskDto) {
    setEditingTask(task);
    setFormOpen(true);
  }

  async function handleSave(value: TaskPayload) {
    if (editingTask) {
      await api.updateTask(editingTask.id, value);
    } else {
      await api.createTask(value);
    }
    setFormOpen(false);
    loadMonth(month);
  }

  async function handleDelete(task: TaskDto) {
    if (!confirm(`"${task.title}" 할일을 삭제할까요?`)) return;
    await api.deleteTask(task.id);
    setFormOpen(false);
    loadMonth(month);
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 bg-lilac/90 backdrop-blur z-10 px-5 pt-6 pb-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-lilac-deep">아빠 계정</div>
            <h1 className="text-xl font-black tracking-tight">스케줄 관리</h1>
          </div>
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-full bg-white border-2 border-ink/10 text-xs font-bold text-ink/40"
            aria-label="로그아웃"
          >
            ↪
          </button>
        </header>

        <main className="px-5 space-y-3.5">
          {tab === "tasks" && (
            <>
              <CalendarView month={month} onMonthChange={setMonth} tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-black">{selectedDate} 할일</span>
                <button
                  onClick={openCreate}
                  className="text-sm font-black bg-ink text-white px-4 py-2 rounded-full active:translate-y-0.5 transition"
                >
                  + 할일 추가
                </button>
              </div>
              {loading ? (
                <div className="card p-8 text-center font-bold text-ink/30">불러오는 중...</div>
              ) : (
                <TaskList items={items} onEdit={openEdit} />
              )}
            </>
          )}

          {tab === "notice" && <NoticeImport onImported={() => loadMonth(month)} />}

          {tab === "rewards" && <RewardManager />}
        </main>
      </div>

      {formOpen && (
        <TaskForm
          initial={editingTask}
          onSave={handleSave}
          onCancel={() => setFormOpen(false)}
          onDelete={editingTask ? () => handleDelete(editingTask) : undefined}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 tab-bar-safe px-4 pb-3 pointer-events-none">
        <div className="max-w-md mx-auto bg-white border-2 border-ink/10 rounded-blob p-1.5 grid grid-cols-3 gap-1 pointer-events-auto shadow-[0_6px_0_0_rgba(20,19,26,0.08)]">
          {(
            [
              { key: "tasks", label: "할일 관리", icon: "🗓️", active: "bg-aqua" },
              { key: "notice", label: "알림장", icon: "📋", active: "bg-coral" },
              { key: "rewards", label: "보상 관리", icon: "🎁", active: "bg-lemon" },
            ] as { key: Tab; label: string; icon: string; active: string }[]
          ).map((t) => (
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

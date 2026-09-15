import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { TaskDto, TaskPayload } from "../lib/types";
import CalendarView from "./CalendarView";
import TaskList, { type OccurrenceItem } from "./TaskList";
import TaskForm from "./TaskForm";
import NoticeImport from "./NoticeImport";
import RewardManager from "./RewardManager";

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
    return list.sort((a, b) => a.task.title.localeCompare(b.task.title));
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
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 bg-cream/90 backdrop-blur z-10 px-5 pt-6 pb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-black/40">아빠 계정</div>
          <h1 className="text-xl font-bold">스케줄 관리</h1>
        </div>
        <button onClick={onLogout} className="text-xs text-black/30 underline">
          로그아웃
        </button>
      </header>

      <main className="px-5 space-y-4">
        {tab === "tasks" && (
          <>
            <CalendarView month={month} onMonthChange={setMonth} tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-black/40">{selectedDate} 할일</span>
              <button onClick={openCreate} className="text-sm font-semibold bg-ink text-white px-3 py-1.5 rounded-full">
                + 할일 추가
              </button>
            </div>
            {loading ? (
              <div className="card p-6 text-center text-black/40">불러오는 중...</div>
            ) : (
              <TaskList items={items} onEdit={openEdit} />
            )}
          </>
        )}

        {tab === "notice" && <NoticeImport onImported={() => loadMonth(month)} />}

        {tab === "rewards" && <RewardManager />}
      </main>

      {formOpen && (
        <TaskForm
          initial={editingTask}
          onSave={handleSave}
          onCancel={() => setFormOpen(false)}
          onDelete={editingTask ? () => handleDelete(editingTask) : undefined}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 tab-bar-safe">
        <div className="max-w-md mx-auto grid grid-cols-3">
          {(
            [
              { key: "tasks", label: "할일 관리", icon: "🗓️" },
              { key: "notice", label: "알림장 가져오기", icon: "📋" },
              { key: "rewards", label: "보상 관리", icon: "🎁" },
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

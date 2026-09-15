import type { TaskDto } from "../lib/types";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

interface DaySummary {
  scheduled: number;
  completed: number;
}

function buildDaySummaries(tasks: TaskDto[]): Map<string, DaySummary> {
  const map = new Map<string, DaySummary>();
  for (const task of tasks) {
    for (const occ of task.occurrences) {
      const cur = map.get(occ.date) ?? { scheduled: 0, completed: 0 };
      cur.scheduled += 1;
      if (occ.completed) cur.completed += 1;
      map.set(occ.date, cur);
    }
  }
  return map;
}

export default function CalendarView({
  month,
  onMonthChange,
  tasks,
  selectedDate,
  onSelectDate,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  tasks: TaskDto[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}) {
  const [y, m] = month.split("-").map(Number);
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const total = daysInMonth(y, m - 1);
  const today = todayStr();
  const summaries = buildDaySummaries(tasks);

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);

  function dayClass(date: string, summary: DaySummary | undefined): string {
    if (!summary || summary.scheduled === 0) return "text-black/70";
    if (summary.completed === summary.scheduled) return "bg-emerald-400 text-white";
    if (summary.completed > 0) return "bg-amber-400 text-white";
    if (date < today) return "border-2 border-rose-300 text-rose-500";
    return "border-2 border-sky-200 text-sky-600";
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onMonthChange(shiftMonth(month, -1))} className="w-8 h-8 rounded-full bg-black/5 text-black/60">
          ‹
        </button>
        <div className="font-bold">
          {y}년 {m}월
        </div>
        <button onClick={() => onMonthChange(shiftMonth(month, 1))} className="w-8 h-8 rounded-full bg-black/5 text-black/60">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-black/40 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const day = Number(date.slice(-2));
          const summary = summaries.get(date);
          const isSelected = selectedDate === date;
          const isToday = date === today;
          return (
            <button
              key={date}
              onClick={() => onSelectDate?.(date)}
              className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center transition ${dayClass(date, summary)} ${
                isSelected ? "ring-2 ring-offset-1 ring-ink" : ""
              } ${isToday ? "font-bold" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-xs text-black/50">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> 모두 완료
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 일부 완료
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border-2 border-rose-300 inline-block" /> 미완료
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border-2 border-sky-200 inline-block" /> 예정
        </span>
      </div>
    </div>
  );
}

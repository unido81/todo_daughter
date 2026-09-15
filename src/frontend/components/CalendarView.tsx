import type { TaskDto } from "../lib/types";
import Face, { type Expression } from "./Face";

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

type DayMood = "done" | "partial" | "missed" | "upcoming" | "free";

function moodOf(date: string, today: string, summary: DaySummary | undefined): DayMood {
  if (!summary || summary.scheduled === 0) return "free";
  if (summary.completed === summary.scheduled) return "done";
  if (summary.completed > 0) return "partial";
  return date < today ? "missed" : "upcoming";
}

const MOOD_STYLE: Record<DayMood, { tile: string; expression: Expression | null; label: string }> = {
  done: { tile: "bg-mint text-ink", expression: "content", label: "모두 완료" },
  partial: { tile: "bg-lemon text-ink", expression: "neutral", label: "일부 완료" },
  missed: { tile: "bg-bubble text-ink", expression: "sad", label: "못한 날" },
  upcoming: { tile: "bg-grape-soft text-ink", expression: "sleepy", label: "예정" },
  free: { tile: "bg-lilac-soft text-ink/35", expression: null, label: "할일 없음" },
};

const LEGEND: DayMood[] = ["done", "partial", "missed", "upcoming"];

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

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(shiftMonth(month, -1))}
          className="w-10 h-10 rounded-full bg-lilac border-2 border-ink/10 font-black text-lg active:translate-y-0.5 transition"
          aria-label="이전 달"
        >
          ‹
        </button>
        <div className="text-xl font-black tracking-tight">
          {y}년 {m}월
        </div>
        <button
          onClick={() => onMonthChange(shiftMonth(month, 1))}
          className="w-10 h-10 rounded-full bg-lilac border-2 border-ink/10 font-black text-lg active:translate-y-0.5 transition"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-ink/35 mb-1.5">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const day = Number(date.slice(-2));
          const mood = moodOf(date, today, summaries.get(date));
          const style = MOOD_STYLE[mood];
          const isSelected = selectedDate === date;
          const isToday = date === today;
          return (
            <button
              key={date}
              onClick={() => onSelectDate?.(date)}
              title={`${day}일 · ${style.label}`}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-0.5 border-2 transition ${style.tile} ${
                isSelected ? "border-ink" : "border-transparent"
              } ${isToday ? "ring-2 ring-grape ring-offset-1" : ""}`}
            >
              <span className={`text-[10px] leading-none ${isToday ? "font-black" : "font-bold"}`}>{day}</span>
              {style.expression && <Face expression={style.expression} className="w-5 h-5" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-2 mt-4 text-[11px] font-bold text-ink/50">
        {LEGEND.map((mood) => {
          const style = MOOD_STYLE[mood];
          return (
            <span key={mood} className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-lg flex items-center justify-center ${style.tile}`}>
                {style.expression && <Face expression={style.expression} className="w-3.5 h-3.5" />}
              </span>
              {style.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

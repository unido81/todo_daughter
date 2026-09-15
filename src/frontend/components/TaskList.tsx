import type { TaskDto } from "../lib/types";
import { CATEGORY_META, categoryChipClass } from "../lib/category";
import Face from "./Face";

export interface OccurrenceItem {
  task: TaskDto;
  date: string;
  completed: boolean;
}

const REPEAT_LABELS: Record<string, string> = {
  once: "한 번",
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
};

export default function TaskList({
  items,
  onToggle,
  onEdit,
  onDelete,
  emptyText = "이 날은 할일이 없어요. 신난다! 🎉",
}: {
  items: OccurrenceItem[];
  onToggle?: (item: OccurrenceItem) => void;
  onEdit?: (task: TaskDto) => void;
  onDelete?: (task: TaskDto) => void;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="card p-8 flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-mint border-2 border-ink/10 flex items-center justify-center text-ink">
          <Face expression="happy" className="w-9 h-9" />
        </div>
        <p className="font-bold text-ink/50">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const meta = CATEGORY_META[item.task.category];
        return (
          <div
            key={`${item.task.id}-${item.date}`}
            className={`card p-4 flex items-center gap-3.5 transition ${item.completed ? "bg-mint-soft" : ""}`}
          >
            {onToggle && (
              <button
                onClick={() => onToggle(item)}
                className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border-2 transition ${
                  item.completed
                    ? "bg-mint border-ink/10 text-ink animate-pop"
                    : "bg-lilac-soft border-dashed border-ink/20 text-ink/20"
                }`}
                aria-label={item.completed ? "완료 취소" : "완료 체크"}
              >
                <Face expression={item.completed ? "happy" : "sleepy"} className="w-7 h-7" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className={`font-extrabold text-[15px] truncate ${item.completed ? "line-through text-ink/35" : ""}`}>
                {item.task.title}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${categoryChipClass(item.task.category)}`}>
                  {meta.emoji} {meta.label}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lilac text-lilac-deep">
                  {REPEAT_LABELS[item.task.repeatType]}
                </span>
                {item.task.points > 0 && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-lemon text-ink border-2 border-ink/10">
                    ⭐ {item.task.points}P
                  </span>
                )}
              </div>
            </div>
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {onEdit && (
                  <button
                    onClick={() => onEdit(item.task)}
                    className="w-9 h-9 rounded-xl bg-lilac border-2 border-ink/10 text-ink/50 text-sm font-bold active:translate-y-0.5 transition"
                    aria-label="수정"
                  >
                    ✎
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(item.task)}
                    className="w-9 h-9 rounded-xl bg-bubble-soft border-2 border-bubble text-bubble-deep text-sm font-bold active:translate-y-0.5 transition"
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

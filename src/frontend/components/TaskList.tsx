import type { TaskDto } from "../lib/types";
import { CATEGORY_META, categoryChipClass } from "../lib/category";

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
  emptyText = "이 날은 할일이 없어요.",
}: {
  items: OccurrenceItem[];
  onToggle?: (item: OccurrenceItem) => void;
  onEdit?: (task: TaskDto) => void;
  onDelete?: (task: TaskDto) => void;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <div className="card p-6 text-center text-black/40 text-sm">{emptyText}</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const meta = CATEGORY_META[item.task.category];
        return (
          <div key={`${item.task.id}-${item.date}`} className="card p-4 flex items-center gap-3">
            {onToggle && (
              <button
                onClick={() => onToggle(item)}
                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition ${
                  item.completed ? "bg-emerald-400 border-emerald-400 text-white" : "border-black/15 text-transparent"
                }`}
                aria-label="완료 체크"
              >
                ✓
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className={`font-semibold truncate ${item.completed ? "line-through text-black/30" : ""}`}>{item.task.title}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryChipClass(item.task.category)}`}>
                  {meta.emoji} {meta.label}
                </span>
                <span className="text-xs text-black/35">{REPEAT_LABELS[item.task.repeatType]}</span>
                {item.task.points > 0 && <span className="text-xs text-amber-600 font-semibold">⭐ {item.task.points}P</span>}
              </div>
            </div>
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {onEdit && (
                  <button onClick={() => onEdit(item.task)} className="w-8 h-8 rounded-full bg-black/5 text-black/50 text-sm">
                    ✎
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(item.task)} className="w-8 h-8 rounded-full bg-black/5 text-black/50 text-sm">
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

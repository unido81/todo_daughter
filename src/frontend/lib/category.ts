import type { Category } from "./types";

export const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string }> = {
  homework: { label: "숙제", emoji: "📝", color: "rose" },
  supplies: { label: "준비물", emoji: "🎒", color: "amber" },
  exam: { label: "시험", emoji: "✏️", color: "red" },
  event: { label: "행사", emoji: "🎪", color: "emerald" },
  other: { label: "기타", emoji: "📌", color: "sky" },
};

export const CATEGORY_ORDER: Category[] = ["homework", "supplies", "exam", "event", "other"];

export function categoryChipClass(category: Category): string {
  const color = CATEGORY_META[category].color;
  return `bg-${color}-100 text-${color}-700 border border-${color}-200`;
}

export function categoryDotClass(category: Category): string {
  const color = CATEGORY_META[category].color;
  return `bg-${color}-400`;
}

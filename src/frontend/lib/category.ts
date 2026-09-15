import type { Category } from "./types";

interface CategoryMeta {
  label: string;
  emoji: string;
  /** 연한 배경 + 진한 글씨 (칩) */
  chip: string;
  /** 꽉 찬 배경 (선택된 상태) */
  solid: string;
  /** 점/작은 표식 */
  dot: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  homework: {
    label: "숙제",
    emoji: "📝",
    chip: "bg-bubble-soft text-bubble-deep border-2 border-bubble",
    solid: "bg-bubble text-ink border-2 border-ink/10",
    dot: "bg-bubble",
  },
  supplies: {
    label: "준비물",
    emoji: "🎒",
    chip: "bg-lemon-soft text-lemon-deep border-2 border-lemon",
    solid: "bg-lemon text-ink border-2 border-ink/10",
    dot: "bg-lemon",
  },
  exam: {
    label: "시험",
    emoji: "✏️",
    chip: "bg-coral-soft text-coral-deep border-2 border-coral",
    solid: "bg-coral text-ink border-2 border-ink/10",
    dot: "bg-coral",
  },
  event: {
    label: "행사",
    emoji: "🎪",
    chip: "bg-mint-soft text-mint-deep border-2 border-mint",
    solid: "bg-mint text-ink border-2 border-ink/10",
    dot: "bg-mint",
  },
  other: {
    label: "기타",
    emoji: "📌",
    chip: "bg-aqua-soft text-aqua-deep border-2 border-aqua",
    solid: "bg-aqua text-ink border-2 border-ink/10",
    dot: "bg-aqua",
  },
};

export const CATEGORY_ORDER: Category[] = ["homework", "supplies", "exam", "event", "other"];

export function categoryChipClass(category: Category): string {
  return CATEGORY_META[category].chip;
}

export function categorySolidClass(category: Category): string {
  return CATEGORY_META[category].solid;
}

export function categoryDotClass(category: Category): string {
  return CATEGORY_META[category].dot;
}

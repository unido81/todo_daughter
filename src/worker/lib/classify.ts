import type { Category } from "../types";

export interface ClassifiedItem {
  title: string;
  category: Category;
  suggestedDate: string | null;
  raw: string;
}

const CATEGORY_KEYWORDS: { category: Category; keywords: string[] }[] = [
  { category: "exam", keywords: ["시험", "평가", "쪽지시험", "단원평가", "테스트"] },
  {
    category: "event",
    keywords: ["체험학습", "소풍", "운동회", "발표회", "현장학습", "참관수업", "방학식", "개학식", "축제", "행사"],
  },
  { category: "supplies", keywords: ["준비물", "지참", "챙겨", "가져오", "가지고 오", "가지고오"] },
  { category: "homework", keywords: ["숙제", "과제", "제출", "풀어오", "써오", "읽어오", "익힘책", "그려오"] },
];

const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function guessCategory(line: string): Category {
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => line.includes(kw))) return category;
  }
  return "other";
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

function guessDate(line: string, today: Date): string | null {
  if (line.includes("오늘")) return fmt(today);
  if (line.includes("모레")) return fmt(addDays(today, 2));
  if (line.includes("내일")) return fmt(addDays(today, 1));

  const weekdayMatch = line.match(/([일월화수목금토])요일/);
  if (weekdayMatch) {
    const targetDow = WEEKDAY_NAMES.indexOf(weekdayMatch[1]);
    const isNextWeek = line.includes("다음주") || line.includes("다음 주");
    const curDow = today.getUTCDay();
    let diff = (targetDow - curDow + 7) % 7;
    if (isNextWeek) diff += diff === 0 ? 7 : 0;
    if (isNextWeek && diff < 7) diff += 7;
    return fmt(addDays(today, diff));
  }

  return null;
}

function stripBullet(line: string): string {
  return line
    .replace(/^\s*[-•※▶●○]\s*/, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .trim();
}

/**
 * Splits a pasted notice-board (알림장) text block into candidate to-do
 * items with a best-effort category and date guess. This is a heuristic
 * draft generator only — the parent reviews/edits every item before it is
 * saved as a real task.
 */
export function classifyNotice(text: string, today: Date = new Date()): ClassifiedItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => stripBullet(l))
    .filter((l) => l.length >= 2);

  return lines.map((raw) => ({
    title: raw,
    category: guessCategory(raw),
    suggestedDate: guessDate(raw, today),
    raw,
  }));
}

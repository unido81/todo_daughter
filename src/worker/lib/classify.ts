import type { Category } from "../types";

export interface ClassifiedItem {
  title: string;
  category: Category;
  suggestedDate: string | null;
  raw: string;
  /** true for lines that look like a subject timetable ("국어 영어 사회") rather than an actual to-do */
  lowConfidence: boolean;
}

const CATEGORY_KEYWORDS: { category: Category; keywords: string[] }[] = [
  { category: "exam", keywords: ["시험", "평가", "쪽지시험", "단원평가", "테스트"] },
  {
    category: "event",
    keywords: [
      "체험학습",
      "소풍",
      "운동회",
      "발표회",
      "현장학습",
      "참관수업",
      "방학식",
      "개학식",
      "축제",
      "행사",
      "체험",
      "만들기",
      "세시풍속",
    ],
  },
  { category: "supplies", keywords: ["준비물", "지참", "챙겨", "가져오", "가지고 오", "가지고오"] },
  {
    category: "homework",
    keywords: [
      "숙제",
      "과제",
      "제출",
      "풀어오",
      "써오",
      "읽어오",
      "익힘책",
      "그려오",
      "풀기",
      "배움공책",
      "배움일기",
      "복습",
      "학습하기",
      "적고",
      "여쭙고",
      "찾기",
    ],
  },
];

const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

// 하이클래스류 알림장을 그대로 복사-붙여넣기 했을 때 섞여 들어오는 화면 잡음
const NOISE_LINE_PATTERNS = [
  /^알림장$/,
  /^\d+월\s*\d+일/, // "9월 4일 (금) 알림장" / "9월 4일 금요일"
  /^[가-힣]{2,4}\s*선생님$/, // "김지혜 선생님"
  /하이톡\s*공유/,
  /^스크랩/,
  /인쇄하기/,
];

const KNOWN_SUBJECTS = new Set([
  "국어",
  "영어",
  "수학",
  "사회",
  "과학",
  "체육",
  "음악",
  "미술",
  "도덕",
  "실과",
  "창체",
  "안전",
  "진로",
  "통합",
  "가정",
  "정보",
]);

function isNoiseLine(line: string): boolean {
  return NOISE_LINE_PATTERNS.some((re) => re.test(line));
}

// "국어 영어 사회" 처럼 과목 이름만 나열된, 오늘 시간표 줄인지 판별
function isTimetableLine(line: string): boolean {
  const tokens = line.split(/\s+/).filter(Boolean);
  if (tokens.length < 2 || tokens.length > 6) return false;
  return tokens.every((t) => KNOWN_SUBJECTS.has(t));
}

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

function stripLeadingBullet(line: string): string {
  return line.replace(/^\s*[-•※▶●○]\s*/, "").trim();
}

const NUMBERED_LINE = /^\s*(\d+)[.)]\s*(.*)$/;

/**
 * Splits a pasted notice-board (알림장) text block into candidate to-do
 * items with a best-effort category and date guess. This is a heuristic
 * draft generator only — the parent reviews/edits every item before it is
 * saved as a real task.
 *
 * Real notice boards are numbered ("1. ... 2. ..."); everything before the
 * first numbered line (title, teacher name, date banner, share button) and
 * any recognized footer/UI chrome is discarded. A line that continues
 * without a new number (text that simply wrapped) is merged into the
 * previous numbered item instead of becoming its own fake item.
 */
export function classifyNotice(text: string, today: Date = new Date()): ClassifiedItem[] {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => stripLeadingBullet(l))
    .filter((l) => l.length >= 2 && !isNoiseLine(l));

  const grouped: string[] = [];
  for (const line of rawLines) {
    const match = line.match(NUMBERED_LINE);
    if (match) {
      grouped.push(match[2].trim());
    } else if (grouped.length > 0) {
      grouped[grouped.length - 1] = `${grouped[grouped.length - 1]} ${line}`.trim();
    }
    // lines before the first numbered item are dropped (page chrome)
  }

  return grouped
    .filter((raw) => raw.length >= 2)
    .map((raw) => ({
      title: raw,
      category: guessCategory(raw),
      suggestedDate: guessDate(raw, today),
      raw,
      lowConfidence: isTimetableLine(raw),
    }));
}

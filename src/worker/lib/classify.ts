import type { Category } from "../types";

export interface ClassifiedItem {
  title: string;
  category: Category;
  suggestedDate: string | null;
  raw: string;
  /** true for lines that look like a subject timetable ("국어 영어 사회") rather than an actual to-do */
  lowConfidence: boolean;
}

/** 앞에 있는 분류가 우선한다. "도시락 가져오기"가 준비물로 잡히도록 supplies 를 event 보다 앞에 둔다. */
const CATEGORY_KEYWORDS: { category: Category; keywords: string[] }[] = [
  { category: "exam", keywords: ["시험", "평가", "쪽지시험", "단원평가", "수행평가", "테스트"] },
  {
    category: "supplies",
    keywords: ["준비물", "지참", "챙겨", "챙기", "가져오", "가져 오", "가지고 오", "가지고오", "들고 오", "들고오", "준비해 오", "준비해오"],
  },
  {
    category: "homework",
    keywords: [
      "숙제",
      "과제",
      "제출",
      "익힘책",
      "풀어오",
      "풀기",
      "써오",
      "쓰기",
      "읽어오",
      "읽기",
      "외워",
      "복습",
      "예습",
      "배움공책",
      "배움일기",
      "독서록",
      "일기",
      "받아쓰기",
      "그려오",
      "학습하기",
      "조사해",
      "찾기",
    ],
  },
  {
    category: "event",
    keywords: [
      "체험학습",
      "현장학습",
      "소풍",
      "운동회",
      "발표회",
      "참관수업",
      "방학식",
      "개학식",
      "축제",
      "행사",
      "체험",
      "만들기",
      "세시풍속",
      "대회",
      "캠프",
      "봉사",
    ],
  },
  {
    category: "notice",
    keywords: [
      "조심",
      "주의",
      "안내",
      "제공",
      "바랍니다",
      "부탁",
      "협조",
      "참고",
      "공지",
      "알려",
      "확인해",
      "감사합니다",
      "양해",
      "금지",
    ],
  },
];

/** "46-47쪽", "32페이지" 처럼 분량이 적힌 줄은 키워드가 없어도 숙제로 본다. */
const PAGE_PATTERN = /\d+\s*(쪽|페이지)/;

/** 초등 알림장에서 흔히 쓰는 줄임말. 딸이 바로 알아볼 수 있게 펼쳐서 보여준다. */
const ABBREVIATIONS: Record<string, string> = {
  수익: "수학익힘책",
  국익: "국어익힘책",
  사익: "사회익힘책",
  과익: "과학익힘책",
  수교: "수학교과서",
  국교: "국어교과서",
};

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

/** 줄이 여기서 끝나지 않고 다음 줄로 이어진 것으로 보이는 꼬리(조사·접속어) */
const CONTINUES_PATTERN = /(및|또는|그리고|부터|와|과|을|를|이|가|에|의|로|으로|하고|,)\s*$/;

function isNoiseLine(line: string): boolean {
  return NOISE_LINE_PATTERNS.some((re) => re.test(line));
}

// "국어 영어 사회" 처럼 과목 이름만 나열된, 그날 시간표 줄인지 판별
function isTimetableLine(line: string): boolean {
  const tokens = line.split(/\s+/).filter(Boolean);
  if (tokens.length < 2 || tokens.length > 8) return false;
  return tokens.every((t) => KNOWN_SUBJECTS.has(t));
}

function expandAbbreviations(text: string): string {
  return text.replace(/(^|[\s(])(수익|국익|사익|과익|수교|국교)(?=[\s\d)]|$)/g, (_m, pre: string, abbr: string) => pre + ABBREVIATIONS[abbr]);
}

function guessCategory(line: string): Category {
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => line.includes(kw))) return category;
  }
  if (PAGE_PATTERN.test(line)) return "homework";
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
    const curDow = today.getUTCDay();
    if (line.includes("다음주") || line.includes("다음 주")) {
      // 다음 주 일요일까지 남은 날수 + 목표 요일
      return fmt(addDays(today, 7 - curDow + targetDow));
    }
    return fmt(addDays(today, (targetDow - curDow + 7) % 7));
  }

  return null;
}

function stripLeadingBullet(line: string): string {
  return line.replace(/^\s*[-•※▶●○]\s*/, "").trim();
}

/** 줄 전체를 감싼 괄호와 끝의 마침표를 떼어내 체크리스트에서 읽기 좋게 만든다. */
function tidyTitle(text: string): string {
  let out = text.trim();
  if (out.startsWith("(") && out.endsWith(")")) out = out.slice(1, -1).trim();
  return out.replace(/[.\s]+$/, "").trim();
}

/** 한 줄 안에 문장이 여러 개면 나눈다. 양쪽이 너무 짧으면 나누지 않는다. */
function splitSentences(line: string): string[] {
  const parts = line
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts.some((p) => p.length < 4)) return [line];
  return parts;
}

const NUMBERED_LINE = /^\s*(\d+)[.)]\s*(.*)$/;

/**
 * Splits a pasted notice-board (알림장) text block into candidate to-do
 * items with a best-effort category and date guess. This is a heuristic
 * draft generator only — the parent reviews/edits every item before it is
 * saved as a real task.
 *
 * Real notice boards are numbered ("1. ... 2. ..."); everything before the
 * first numbered line (title, teacher name, date banner, share button) is
 * discarded. One numbered entry often holds several instructions at once
 * ("금요일 송편만들기 있음. 도시락 가져오기"), so each entry is split back
 * into individual lines and sentences — otherwise a 준비물 buried inside an
 * 행사 sentence never becomes its own checkable item. A date mentioned
 * anywhere in the entry ("금요일") applies to every item split out of it.
 */
export function classifyNotice(text: string, today: Date = new Date()): ClassifiedItem[] {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => stripLeadingBullet(l))
    .filter((l) => l.length >= 2 && !isNoiseLine(l));

  // 번호를 매기지 않는 선생님도 있다. 번호가 하나도 없으면 줄 자체를 항목으로 본다.
  const hasNumbering = rawLines.some((l) => NUMBERED_LINE.test(l));

  const groups: string[][] = [];
  for (const line of rawLines) {
    const match = hasNumbering ? line.match(NUMBERED_LINE) : null;
    if (match) {
      groups.push([match[2].trim()]);
      continue;
    }
    if (!hasNumbering) {
      groups.push([line]);
      continue;
    }
    // 번호가 붙기 전에 나오는 줄(페이지 제목, 선생님 이름 등)은 버린다
    if (groups.length === 0) continue;

    const current = groups[groups.length - 1];
    const previous = current[current.length - 1];
    if (CONTINUES_PATTERN.test(previous)) {
      current[current.length - 1] = `${previous} ${line}`.trim();
    } else {
      current.push(line);
    }
  }

  const items: ClassifiedItem[] = [];
  for (const group of groups) {
    const groupDate = guessDate(group.join(" "), today);

    for (const line of group) {
      for (const sentence of splitSentences(line)) {
        const raw = expandAbbreviations(sentence);
        const title = tidyTitle(raw);
        if (title.length < 2) continue;

        const timetable = isTimetableLine(title);
        items.push({
          title: timetable ? `시간표: ${title}` : title,
          category: timetable ? "notice" : guessCategory(title),
          suggestedDate: guessDate(title, today) ?? groupDate,
          raw: sentence,
          lowConfidence: timetable,
        });
      }
    }
  }

  return items;
}

import type { Chart } from "./numerology";

// ── Content data (fetched at runtime from Supabase) ─────────────────────────

type Lookup = Record<string, string>;

export type ContentData = {
  story: Lookup; // story number  -> line
  root: Lookup; // root number   -> line
  characteristics: Record<string, Lookup>; // hidden|parent|impression|subconscious -> (number -> line)
  majorminor: Record<string, Lookup>; // many|less|perfect -> (number -> line)
  health: Lookup; // element -> line
  career: Lookup; // element -> line
};

export const EMPTY_CONTENT: ContentData = {
  story: {},
  root: {},
  characteristics: {},
  majorminor: {},
  health: {},
  career: {},
};

// One row as returned by the Supabase `content` table.
export type ContentRow = {
  section: string;
  subtype: string;
  item_key: string;
  line: string;
};

// The sheet's raw `Type` values map onto the keys the sections already use.
const HIDDEN_TYPE_MAP: Record<string, string> = {
  Hidden: "hidden",
  Parents: "parent",
  Impression: "impression",
  Subconscious: "subconscious",
};
const MAJORMINOR_TYPE_MAP: Record<string, string> = {
  Many: "many",
  Less: "less",
  Perfect: "perfect",
};

// Turn the flat rows from Supabase into the nested lookups the getters expect.
export function buildContentData(rows: ContentRow[]): ContentData {
  const data: ContentData = {
    story: {},
    root: {},
    characteristics: {},
    majorminor: {},
    health: {},
    career: {},
  };
  for (const r of rows) {
    switch (r.section) {
      case "story":
        data.story[r.item_key] = r.line;
        break;
      case "root":
        data.root[r.item_key] = r.line;
        break;
      case "hidden": {
        const key = HIDDEN_TYPE_MAP[r.subtype] ?? r.subtype.toLowerCase();
        (data.characteristics[key] ??= {})[r.item_key] = r.line;
        break;
      }
      case "majorminor": {
        const key = MAJORMINOR_TYPE_MAP[r.subtype] ?? r.subtype.toLowerCase();
        (data.majorminor[key] ??= {})[r.item_key] = r.line;
        break;
      }
      case "health":
        data.health[r.item_key] = r.line;
        break;
      case "career":
        data.career[r.item_key] = r.line;
        break;
    }
  }
  return data;
}

// ── Metadata (static — not premium) ─────────────────────────────────────────

export const DIRECTION_CATEGORIES: { key: "wealth" | "luck" | "success"; label: string; color: string }[] = [
  { key: "wealth", label: "财富", color: "#d97706" },
  { key: "luck", label: "幸运", color: "#16a34a" },
  { key: "success", label: "成功", color: "#2563eb" },
];

// Five-element display metadata (character + accent colour).
export const ELEMENT_META: Record<string, { label: string; color: string }> = {
  gold: { label: "金", color: "#a16207" },
  wood: { label: "木", color: "#16a34a" },
  water: { label: "水", color: "#2563eb" },
  fire: { label: "火", color: "#dc2626" },
  earth: { label: "土", color: "#d97706" },
};

// Body systems associated with each element (for the Health section).
export const HEALTH_ORGANS: Record<string, string> = {
  gold: "肺 · 呼吸 · 皮肤",
  wood: "肝 · 胆 · 筋",
  water: "肾 · 膀胱 · 骨",
  fire: "心 · 血液循环",
  earth: "脾 · 胃 · 消化",
};

// Career recommendation order per element (best fit first).
export const CAREER_ORDER: Record<string, string[]> = {
  gold: ["wood", "earth", "gold"],
  water: ["fire", "gold", "water"],
  wood: ["earth", "water", "wood"],
  fire: ["gold", "wood", "fire"],
  earth: ["water", "fire", "earth"],
};

// Rank labels for the three career recommendations.
export const CAREER_RANKS = ["首选", "次选", "第三选择"];

// ── Status helpers (static) ─────────────────────────────────────────────────

// Balance status for an ability count (0 = lacking, 1-2 = just right, ≥3 = excess).
export function getAbilityStatus(count: number) {
  if (count === 0) return { label: "缺少", color: "#dc2626", bg: "#fee2e2" };
  if (count >= 3) return { label: "偏多", color: "#d97706", bg: "#fef3c7" };
  return { label: "刚刚好", color: "#16a34a", bg: "#dcfce7" };
}

// Balance status for a five-element count (1 = balanced, 0 = lacking, ≥2 = excess).
export function getHealthStatus(count: number) {
  if (count === 1) return { label: "平衡", color: "#16a34a", bg: "#dcfce7", warn: false };
  if (count === 0) return { label: "缺少", color: "#dc2626", bg: "#fee2e2", warn: true };
  return { label: "偏多", color: "#d97706", bg: "#fef3c7", warn: true };
}

// ── Line getters (read the fetched ContentData) ─────────────────────────────

export function getSummaryLine() {
  return "";
}

export function getRootLine(data: ContentData, num: string | number) {
  return data.root[String(num)] ?? "";
}

export function getStoryLine(data: ContentData, num: string | number) {
  return data.story[String(num)] ?? "";
}

const storyTitles: Record<string, string> = {
  "1": "孤独",
  "2": "健谈",
  "3": "积极",
  "4": "计划",
  "5": "固执",
  "6": "金钱",
  "7": "支持者",
  "8": "压力",
  "9": "生意",
};
export function getStoryTitles(num: string) {
  const words = num.split("").map((d) => storyTitles[d]).filter(Boolean);
  if (Number(num) < 10) return words.length ? `关键性格 — ${words[0]}` : "";
  else if (Number(num) < 20) return words.length ? `你；${words[1]}` : "";
  else if (Number(num) == 33) return words.length ? `积极；侵略性` : "";
  return words.length ? `${words.join("；")}` : "";
}

export function getCharacteristicsLine(data: ContentData, key: string, num: string | number) {
  return data.characteristics[key]?.[String(num)] ?? "";
}

export function getMajorMinorLine(data: ContentData, index: number, num: number) {
  const key = num == 0 ? "less" : num >= 3 ? "many" : "perfect";
  return data.majorminor[key]?.[String(index + 1)] ?? "";
}

export function getHealthLine(data: ContentData, element: string, count: number) {
  if (count == 1) return "";
  return data.health[element] ?? "";
}

export function getCareerPlan(data: ContentData, element: string) {
  const order = CAREER_ORDER[element] ?? [];
  return order.map((el) => ({ element: el, line: data.career[el] ?? "" }));
}

// ── AI summary source material ──────────────────────────────────────────────

export type StorySource = { title: string; lines: string[] };

// Collect the personalised lines the five source sections display for this
// chart — the raw material the AI synthesises into the 总体故事 section.
export function collectStorySources(data: ContentData, chart: Chart): StorySource[] {
  const tidy = (lines: string[]) => lines.map((l) => l.trim()).filter(Boolean);

  // 数字故事 — root number line + each story-number line. Duplicate story
  // numbers aren't repeated as text, but their occurrence count is annotated so
  // the AI can emphasise stronger (more frequent) traits.
  const story: string[] = [];
  const rootLine = getRootLine(data, chart.rootNumber);
  if (rootLine) story.push(`根数 ${chart.rootNumber}：${rootLine}`);
  const storyCounts = new Map<string, number>();
  for (const n of chart.storyNumbers) storyCounts.set(n, (storyCounts.get(n) ?? 0) + 1);
  for (const num of chart.uniqueStoryNumbers) {
    const line = getStoryLine(data, num);
    if (!line) continue;
    const count = storyCounts.get(num) ?? 1;
    story.push(
      count > 1 ? `${num}（出现 ${count} 次，性格更突出）：${line}` : `${num}：${line}`,
    );
  }

  // 隐藏性格 — five slots over the hidden numbers (matches HiddenCharacterSection).
  const hiddenSlots: { key: string; label: string; index: number }[] = [
    { key: "hidden", label: "隐藏性格", index: 0 },
    { key: "parent", label: "与父亲关系", index: 1 },
    { key: "parent", label: "与母亲关系", index: 2 },
    { key: "impression", label: "外表给人的感觉", index: 3 },
    { key: "subconscious", label: "潜意识性格", index: 4 },
  ];
  const hidden = hiddenSlots.map((s) => {
    const n = chart.hiddenNumbers[s.index];
    const line = getCharacteristicsLine(data, s.key, n);
    return line ? `${s.label}（${n}）：${line}` : "";
  });

  // 能力分布 — the 1-9 ability lines.
  const ability = chart.countMajorMinor.map((count, i) => {
    const line = getMajorMinorLine(data, i, count);
    return line ? `数字 ${i + 1}（出现 ${count} 次）：${line}` : "";
  });

  // 健康关系 — only the imbalanced (flagged) elements carry a line.
  const health: string[] = [];
  for (const [element, count] of Object.entries(chart.countHealth)) {
    if (!getHealthStatus(count).warn) continue;
    const line = getHealthLine(data, element, count);
    if (line) health.push(`${ELEMENT_META[element]?.label ?? element}：${line}`);
  }

  // 事业和职业选择 — the ranked career recommendations.
  const career = getCareerPlan(data, chart.careerElement).map(({ element, line }) =>
    line ? `${ELEMENT_META[element]?.label ?? element}行：${line}` : "",
  );

  return [
    { title: "数字故事", lines: tidy(story) },
    { title: "隐藏性格", lines: tidy(hidden) },
    { title: "能力分布", lines: tidy(ability) },
    { title: "健康关系", lines: tidy(health) },
    { title: "事业和职业选择", lines: tidy(career) },
  ];
}

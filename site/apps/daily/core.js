import { figures, groups } from "../../shared/history.js";
import { shanghaiDate } from "../../shared/storage.js";
export const DAILY_VERSION = "daily-v1-50";
export const hiddenIds = [
  "liubowen",
  "sunbin",
  "fengdao",
  "loushide",
  "guoziyi",
  "tangbohu",
  "xuwei",
  "zhangheng",
  "bisheng",
  "xuxiake",
];
const dayNumber = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error("日期无效");
  const n = Date.parse(date + "T00:00:00Z");
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== date)
    throw Error("日期无效");
  return Math.floor(n / 86400000);
};
const mod = (v, n) => ((v % n) + n) % n;
export function dailyQuestion(date = shanghaiDate()) {
  const day = dayNumber(date),
    figure = figures[mod(day * 17 + 11, figures.length)],
    same = figures.filter(
      (f) => f.group === figure.group && f.id !== figure.id,
    );
  const distractors = same.slice(mod(day, 2), mod(day, 2) + 3);
  const four = [figure, ...distractors];
  const shift = mod(day, 4),
    options = [...four.slice(shift), ...four.slice(0, shift)];
  return {
    date,
    figure,
    options,
    clue: mod(Math.floor(day / 50), 2) ? figure.contrast : figure.verdict,
    hints: [
      `朝代线索：${figure.dynasty}`,
      `原型线索：${groups.find((g) => g.id === figure.group)?.name || "人物原型"}；${figure.bio.slice(0, 35)}…`,
    ],
  };
}
export function initialDaily() {
  return { version: DAILY_VERSION, days: {}, unlocked: [] };
}
export function validateDaily(raw) {
  if (
    !raw ||
    raw.version !== DAILY_VERSION ||
    !raw.days ||
    Array.isArray(raw.days) ||
    typeof raw.days !== "object" ||
    !Array.isArray(raw.unlocked)
  )
    return initialDaily();
  const days = {};
  for (const [date, value] of Object.entries(raw.days)) {
    try {
      dayNumber(date);
      if (
        value &&
        Array.isArray(value.wrong) &&
        value.wrong.every((id) =>
          dailyQuestion(date).options.some((f) => f.id === id),
        ) &&
        typeof value.solved === "boolean"
      )
        days[date] = { wrong: [...new Set(value.wrong)], solved: value.solved };
    } catch {}
  }
  return {
    version: DAILY_VERSION,
    days,
    unlocked: [...new Set(raw.unlocked.filter((id) => hiddenIds.includes(id)))],
  };
}
export function winStreak(days, date) {
  let day = dayNumber(date),
    streak = 0;
  while (days[new Date(day * 86400000).toISOString().slice(0, 10)]?.solved) {
    streak++;
    day--;
  }
  return streak;
}
export function answerDaily(state, date, id) {
  const question = dailyQuestion(date);
  if (!question.options.some((f) => f.id === id)) throw Error("选项无效");
  const next = validateDaily(state),
    entry = next.days[date] ?? { wrong: [], solved: false };
  if (entry.solved)
    return {
      state: next,
      correct: true,
      already: true,
      streak: winStreak(next.days, date),
    };
  if (id === question.figure.id) entry.solved = true;
  else if (!entry.wrong.includes(id)) entry.wrong.push(id);
  next.days[date] = entry;
  let unlocked = null;
  const streak = winStreak(next.days, date);
  if (entry.solved && streak % 3 === 0) {
    unlocked = hiddenIds.find((id) => !next.unlocked.includes(id));
    if (unlocked) next.unlocked.push(unlocked);
  }
  return { state: next, correct: entry.solved, streak, unlocked };
}

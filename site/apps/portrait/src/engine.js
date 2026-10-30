import figures from "../../../../data/figures.json" with { type: "json" };
import questions from "../../../../data/questions.json" with { type: "json" };
import groups from "../../../../data/groups.json" with { type: "json" };
import dimensions from "../../../../data/dimensions.json" with { type: "json" };
export { figures, questions, groups, dimensions };
export const DATA_VERSION = "portrait-v2-50-30-20261030-r2";
export const categories = [...new Set(questions.map((q) => q.category))];
export const groupFor = (id) => groups.find((g) => g.id === id);
export const figureFor = (id) => figures.find((f) => f.id === id);
const quickIndexes = [0, 2, 4, 5, 8, 10, 12, 14, 15, 18, 20, 22, 24, 25, 28];
export function questionIds(mode) {
  return (
    mode === "quick" ? quickIndexes.map((i) => questions[i]) : questions
  ).map((q) => q.id);
}
export function isValidSession(session) {
  if (
    !session ||
    session.version !== DATA_VERSION ||
    !["quick", "full"].includes(session.mode)
  )
    return false;
  const ids = questionIds(session.mode);
  if (
    !Number.isInteger(session.index) ||
    session.index < 0 ||
    session.index >= ids.length ||
    !session.answers ||
    Array.isArray(session.answers)
  )
    return false;
  return Object.entries(session.answers).every(
    ([id, option]) =>
      ids.includes(id) &&
      questions.find((q) => q.id === id).options.some((o) => o.id === option),
  );
}
export function scoreAnswers(ids, answers, { partial = false } = {}) {
  const totals = Array(8).fill(0),
    ranges = Array(8).fill(0);
  for (const id of ids) {
    const q = questions.find((q) => q.id === id);
    if (!q) throw new Error("题目不存在");
    const o = q.options.find((o) => o.id === answers[id]);
    if (!o) {
      if (partial) continue;
      throw new Error("请完成全部题目");
    }
    for (let d = 0; d < 8; d++) {
      const minimum = Math.min(...q.options.map((option) => option.vec[d]));
      const maximum = Math.max(...q.options.map((option) => option.vec[d]));
      totals[d] += (o.vec[d] - minimum) * q.weights[d];
      ranges[d] += (maximum - minimum) * q.weights[d];
    }
  }
  return totals.map((v, d) => (ranges[d] ? 1 + (9 * v) / ranges[d] : 5.5));
}
export function rankFigures(vec) {
  if (
    !Array.isArray(vec) ||
    vec.length !== 8 ||
    vec.some((v) => !Number.isFinite(v) || v < 1 || v > 10)
  )
    throw new Error("八维分数须在1—10之间");
  return figures
    .map((figure) => {
      const distance = Math.hypot(...figure.vec.map((v, i) => v - vec[i]));
      return {
        figure,
        distance,
        similarity: Math.round(100 * (1 - distance / (9 * Math.sqrt(8)))),
      };
    })
    .sort(
      (a, b) =>
        a.distance - b.distance || a.figure.id.localeCompare(b.figure.id),
    );
}
export function agreement(figure, ids, answers) {
  return ids.map((id) => {
    const q = questions.find((q) => q.id === id),
      option = q?.options.find((o) => o.id === answers[id]);
    if (!q || !option) throw new Error("答案不完整");
    const directions = [figure.tendencies[q.category]].flat();
    return {
      id,
      prompt: q.prompt,
      category: q.categoryLabel,
      chosen: option.label,
      aligned: directions.includes(option.direction),
      expected: q.options
        .filter((o) => directions.includes(o.direction))
        .map((o) => o.label),
    };
  });
}
export function buildResult(session) {
  const ids = questionIds(session.mode),
    vec = scoreAnswers(ids, session.answers),
    ranked = rankFigures(vec);
  const primary = ranked[0],
    details = agreement(primary.figure, ids, session.answers);
  const gaps = dimensions
    .map((d, i) => ({
      ...d,
      gap: Math.abs(vec[i] - primary.figure.vec[i]),
      user: vec[i],
      figure: primary.figure.vec[i],
      evidence: primary.figure.evidence[i],
    }))
    .sort((a, b) => a.gap - b.gap || a.id - b.id);
  return {
    version: DATA_VERSION,
    mode: session.mode,
    total: ids.length,
    vec,
    primary,
    secondary: ranked.slice(1, 3),
    count: details.filter((d) => d.aligned).length,
    details,
    closest: gaps.slice(0, 3),
    contrast: gaps.at(-1),
    createdAt: Date.now(),
  };
}
export function personalityTags(vec) {
  const labels = [
    "敢于尝试",
    "先想一步",
    "从容调适",
    "主动连接",
    "体察他人",
    "重视规则",
    "持续投入",
    "表达鲜明",
  ];
  return vec
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v || a.i - b.i)
    .slice(0, 3)
    .map(({ i }) => labels[i]);
}
export function invitationUrl(id, href) {
  if (!figureFor(id)) throw new Error("人物不存在");
  const url = new URL(href);
  url.search = "";
  url.hash = `/invite/${id}`;
  return url.href;
}

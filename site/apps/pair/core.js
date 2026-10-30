import pairs from "../../../data/relationship-pairs.json" with { type: "json" };
import related from "../../../data/related-figures.json" with { type: "json" };
import {
  dimensions,
  figures,
  DATA_VERSION,
  rankFigures,
} from "../../shared/history.js";
export { pairs };
export const pairFigure = (id) =>
  figures.find((f) => f.id === id) || related.find((f) => f.id === id);
const validVec = (v) =>
  Array.isArray(v) &&
  v.length === 8 &&
  v.every((n) => Number.isFinite(n) && n >= 1 && n <= 10);
export function encodePartner(vec) {
  if (!validVec(vec)) throw Error("需要完整的八维结果");
  const rounded = vec.map((n) => Math.round(n * 100) / 100);
  return btoa(
    JSON.stringify({
      v: 1,
      data: DATA_VERSION,
      vec: rounded,
      id: rankFigures(rounded)[0].figure.id,
    }),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
export function decodePartner(token) {
  try {
    if (
      typeof token !== "string" ||
      token.length > 1500 ||
      !/^[\w-]+$/.test(token)
    )
      throw Error();
    const s = token.replaceAll("-", "+").replaceAll("_", "/"),
      p = JSON.parse(atob(s + "=".repeat((4 - (s.length % 4)) % 4)));
    if (
      p.v !== 1 ||
      p.data !== DATA_VERSION ||
      !validVec(p.vec) ||
      rankFigures(p.vec)[0].figure.id !== p.id
    )
      throw Error();
    return p;
  } catch {
    throw Error("邀请链接无效或来自旧版本，请邀请者重新生成");
  }
}
export function partnerLink(vec, href) {
  const url = new URL("../pair/index.html", href);
  url.hash = "";
  url.search = "";
  url.hash = "a=" + encodePartner(vec);
  return url.href;
}
export function pairReport(a, b) {
  if (!validVec(a) || !validVec(b)) throw Error("双人分数不完整");
  const gaps = a.map((v, i) => ({
      ...dimensions[i],
      a: v,
      b: b[i],
      gap: Math.abs(v - b[i]),
    })),
    distance = gaps.reduce((s, d) => s + d.gap, 0);
  const ranked = pairs
    .map((pair) => {
      const calc = (x, y) =>
        Math.hypot(...a.map((n, i) => n - x[i]), ...b.map((n, i) => n - y[i]));
      return {
        ...pair,
        distance: Math.min(
          calc(pair.vecA, pair.vecB),
          calc(pair.vecB, pair.vecA),
        ),
      };
    })
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
  return {
    similarity: Math.round(100 * (1 - distance / 72)),
    close: gaps.filter((d) => d.gap <= 1.5).length,
    total: 8,
    gaps,
    relation: ranked[0],
    complement: [...gaps]
      .filter((d) => [0, 1, 3, 7].includes(d.id))
      .sort((a, b) => b.gap - a.gap)[0],
    conflict: [...gaps]
      .filter((d) => [2, 4, 5].includes(d.id))
      .sort((a, b) => b.gap - a.gap)[0],
  };
}

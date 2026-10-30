import hexagrams from "../../../data/hexagrams.json" with { type: "json" };
import { parseCivilTime } from "../../shared/calendar.js";
export { hexagrams };
const trigrams = [
  { name: "乾", lines: [1, 1, 1] },
  { name: "兑", lines: [1, 1, 0] },
  { name: "离", lines: [1, 0, 1] },
  { name: "震", lines: [1, 0, 0] },
  { name: "巽", lines: [0, 1, 1] },
  { name: "坎", lines: [0, 1, 0] },
  { name: "艮", lines: [0, 0, 1] },
  { name: "坤", lines: [0, 0, 0] },
];
export function byLines(lines) {
  if (
    !Array.isArray(lines) ||
    lines.length !== 6 ||
    lines.some((v) => v !== 0 && v !== 1)
  )
    throw Error("需要六条由下而上的阴阳线");
  const result = hexagrams.find((h) => h.lines.every((v, i) => v === lines[i]));
  if (!result) throw Error("卦象不存在");
  return result;
}
export function coinThrow(random = Math.random) {
  const coins = Array.from({ length: 3 }, () => {
    const r = random();
    if (!Number.isFinite(r) || r < 0 || r >= 1)
      throw Error("随机值须在0至1之间");
    return r < 0.5 ? 2 : 3;
  });
  return { coins, total: coins.reduce((a, b) => a + b, 0) };
}
export function coinsResult(totals) {
  if (
    !Array.isArray(totals) ||
    totals.length !== 6 ||
    totals.some((n) => ![6, 7, 8, 9].includes(n))
  )
    throw Error("请完成六次三钱投掷");
  const lines = totals.map((n) => n % 2),
    changed = totals.map((n) => (n === 6 ? 1 : n === 9 ? 0 : n % 2)),
    moving = totals.flatMap((n, i) => ([6, 9].includes(n) ? [i + 1] : []));
  return {
    main: byLines(lines),
    changed: byLines(changed),
    lines,
    moving,
    totals: [...totals],
    method:
      "三钱六掷：每枚两面分别记2、3，6老阴、7少阳、8少阴、9老阳；从下往上成形。",
  };
}
export function timeResult(value) {
  const { solar, hour } = parseCivilTime(value),
    l = solar.getLunar(),
    year = l.getYearZhiIndex() + 1,
    month = Math.abs(l.getMonth()),
    day = l.getDay(),
    hourOrder = Math.floor(((hour + 1) % 24) / 2) + 1,
    sum = year + month + day;
  const rem = (n, k) => (n - 1) % k;
  const upper = trigrams[rem(sum, 8)],
    lower = trigrams[rem(sum + hourOrder, 8)],
    moving = rem(sum + hourOrder, 6) + 1,
    lines = [...lower.lines, ...upper.lines],
    changed = [...lines];
  changed[moving - 1] = 1 - changed[moving - 1];
  return {
    main: byLines(lines),
    changed: byLines(changed),
    lines,
    moving: [moving],
    method:
      "年月日时数法的明确简化：农历年支序+农历月+日取上卦，加时支序取下卦，再以6取动爻。年支按农历年换年，闰月取月份绝对值；不采用分钟，也不把结果称作个人命盘。",
    calculation: {
      lunar: l.toString(),
      year,
      month,
      day,
      hourOrder,
      upper: upper.name,
      lower: lower.name,
      moving,
    },
  };
}

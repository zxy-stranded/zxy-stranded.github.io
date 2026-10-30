import lunar from "lunar-javascript";
export function parseCivilTime(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || "");
  if (!m) throw Error("请填写完整日期与时间");
  const [year, month, day, hour, minute] = m.slice(1).map(Number),
    check = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    year < 1901 ||
    year > 2099 ||
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  )
    throw Error("日期无效，支持1901—2099年");
  return {
    year,
    month,
    day,
    hour,
    minute,
    solar: lunar.Solar.fromYmdHms(year, month, day, hour, minute, 0),
  };
}
export function elementReference(value) {
  const { solar } = parseCivilTime(value),
    eight = solar.getLunar().getEightChar();
  eight.setSect(2);
  const pillars = [
      eight.getYear(),
      eight.getMonth(),
      eight.getDay(),
      eight.getTime(),
    ],
    gan = {
      甲: "木",
      乙: "木",
      丙: "火",
      丁: "火",
      戊: "土",
      己: "土",
      庚: "金",
      辛: "金",
      壬: "水",
      癸: "水",
    },
    zhi = {
      子: "水",
      丑: "土",
      寅: "木",
      卯: "木",
      辰: "土",
      巳: "火",
      午: "火",
      未: "土",
      申: "金",
      酉: "金",
      戌: "土",
      亥: "水",
    },
    counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of pillars) {
    counts[gan[p[0]]]++;
    counts[zhi[p[1]]]++;
  }
  const min = Math.min(...Object.values(counts));
  return {
    pillars,
    counts,
    less: Object.keys(counts).filter((k) => counts[k] === min),
    lunar: solar.getLunar().toString(),
    note: "按输入的UTC+8民用时间计算；年、月柱采用节气口径，子时日柱用流派2。仅统计八个表层干支，不计藏干、强弱、真太阳时；不用于判断需要补充何种元素。",
  };
}

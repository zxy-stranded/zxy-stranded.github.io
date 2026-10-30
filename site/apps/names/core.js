import characters from "../../../data/naming/characters.json" with { type: "json" };
import poems from "../../../data/naming/poems.json" with { type: "json" };
import surnames from "../../../data/naming/surnames.json" with { type: "json" };
import { elementReference } from "../../shared/calendar.js";
export { characters, poems, surnames, elementReference };
const chars = new Map(characters.map((c) => [c.char, c])),
  cache = new Map();
const badSound = [
  "siwang",
  "shibai",
  "duyao",
  "bendan",
  "fanzui",
  "yinjing",
  "yangwei",
  "chouyan",
  "goushi",
  "bichi",
];
const pretty = new Set([
  "清和",
  "清扬",
  "静好",
  "子衿",
  "思齐",
  "如玉",
  "景行",
  "怀瑾",
  "嘉言",
  "懿行",
  "望舒",
  "知意",
  "星河",
  "云舒",
  "沐言",
  "知夏",
  "若溪",
  "书宁",
  "安然",
  "予安",
  "清欢",
  "南风",
  "云帆",
  "星辰",
  "宜修",
  "芳芷",
  "兰若",
  "子宁",
  "嘉树",
  "思远",
  "文茵",
  "静姝",
  "如云",
  "景明",
  "悠然",
  "清越",
  "念初",
  "若水",
  "明轩",
  "昭明",
]);
export function surnameInfo(value, pronunciation = "") {
  const name = (value || "").trim();
  if (!/^[\u3400-\u9fff]{1,2}$/.test(name)) throw Error("姓氏请填写1—2个汉字");
  const known = surnames.find((s) => s.name === name);
  if (!pronunciation.trim()) {
    if (known) return known;
    throw Error("该姓氏暂未标注，请在下方填写家族确认的读音，如qi2");
  }
  const syllables = pronunciation.toLowerCase().trim().split(/\s+/);
  if (
    syllables.length !== name.length ||
    syllables.some(
      (s) => !/^([a-züv]{1,7})([1-4])$/.test(s) || !/[aeiouüv]/.test(s),
    )
  )
    throw Error("读音请按每字填写拼音与数字声调，复姓用空格分隔，如ou1 yang2");
  return {
    name,
    pinyin: syllables.join(" "),
    tones: syllables.map((s) => Number(s.at(-1))),
    plain: syllables.map((s) => s.slice(0, -1).replaceAll("ü", "v")).join(""),
    unlisted: !known,
    manual: true,
  };
}
export function soundCheck(surname, a, b) {
  const tones = [...surname.tones, a.tone, b.tone],
    sound = surname.plain + a.plain + b.plain;
  if (
    tones.every((t) => t === tones[0]) ||
    a.char === b.char ||
    surname.name.at(-1) === a.char ||
    badSound.some((s) => sound.includes(s))
  )
    return null;
  const repeated = a.plain === b.plain,
    transition = a.tone !== b.tone,
    score =
      (transition ? 9 : 5) +
      (surname.tones.at(-1) !== a.tone ? 5 : 2) -
      (repeated ? 4 : 0);
  return {
    score,
    note: repeated
      ? "名字两字同音，建议与家人试读确认。"
      : transition
        ? "名中字调有起伏，建议连姓多读几遍。"
        : "名中字调相同、全名仍有变化，建议试读。",
  };
}
export function validateNameInput(input) {
  const surname = surnameInfo(input.surname, input.pronunciation || "");
  if (input.mother && !/^[\u3400-\u9fff]{1,2}$/.test(input.mother))
    throw Error("母亲姓氏请填写1—2个汉字");
  if (
    !["ancient", "modern", "neutral", "shijing", "chuci"].includes(input.style)
  )
    throw Error("请选择名字风格");
  if (!["any", "male", "female"].includes(input.gender))
    throw Error("请选择偏好");
  if (input.birth) elementReference(input.birth);
  if (input.includeMother && !input.mother) throw Error("请先填写母亲姓氏");
  if (input.includeMother && ![...input.mother].some((c) => chars.has(c)))
    throw Error("本字库暂未收录母亲姓氏中的字，请取消融入或更换姓氏");
  return surname;
}
export function generateNames(input, batch = 0) {
  const surname = validateNameInput(input);
  if (!Number.isInteger(batch) || batch < 0) throw Error("批次无效");
  const key = JSON.stringify(input);
  let pool = cache.get(key);
  const analysis = input.birth ? elementReference(input.birth) : null;
  if (!pool) {
    const candidates = new Map(),
      gender = input.gender,
      accept = (c) =>
        gender === "any" || c.gender === "neutral" || c.gender === gender,
      motherChars = [...(input.mother || "")].filter((c) => chars.has(c));
    const add = (a, b, source = null) => {
      if (!accept(a) || !accept(b)) return;
      if (
        input.includeMother &&
        !motherChars.includes(a.char) &&
        !motherChars.includes(b.char)
      )
        return;
      const sound = soundCheck(surname, a, b);
      if (!sound) return;
      const name = surname.name + a.char + b.char;
      const styleScore =
        input.style === "modern"
          ? (Number(a.common) + Number(b.common)) * 5
          : input.style === "neutral"
            ? (Number(a.gender === "neutral") +
                Number(b.gender === "neutral")) *
              4
            : 0;
      const elementScore = analysis
        ? (analysis.less.includes(a.element) ? 2 : 0) +
          (analysis.less.includes(b.element) ? 2 : 0)
        : 0;
      const score =
        sound.score +
        styleScore +
        elementScore +
        (source ? 8 : 0) +
        (pretty.has(a.char + b.char) ? 14 : 0);
      const record = {
        name,
        given: a.char + b.char,
        pinyin: surname.pinyin + " " + a.pinyin + " " + b.pinyin,
        chars: [a, b],
        source,
        sound: sound.note,
        score,
        elementNote: analysis
          ? "按本字库归类提供文化参考，不代表改善任何个人结果。"
          : "未填写出生时间，不作历法统计。",
      };
      if (!candidates.has(name) || candidates.get(name).score < score)
        candidates.set(name, record);
    };
    for (const poem of poems) {
      if (
        (input.style === "shijing" && poem.collection !== "诗经") ||
        (input.style === "chuci" && poem.collection !== "楚辞")
      )
        continue;
      const letters = [...poem.quote];
      for (let i = 0; i < letters.length; i++) {
        const a = chars.get(letters[i]);
        if (!a) continue;
        for (let j = i + 1; j < Math.min(letters.length, i + 7); j++) {
          const b = chars.get(letters[j]);
          if (b) add(a, b, poem);
        }
      }
    }
    if (!["shijing", "chuci"].includes(input.style)) {
      const usable = characters
        .filter(accept)
        .sort((a, b) => Number(b.common) - Number(a.common));
      for (const a of usable.slice(0, 85))
        for (const b of usable.slice(0, 100)) add(a, b);
      if (input.includeMother)
        for (const c of motherChars) {
          const m = chars.get(c);
          for (const other of usable.slice(0, 100)) {
            add(m, other);
            add(other, m);
          }
        }
    }
    pool = [...candidates.values()].sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name),
    );
    if (cache.size >= 8) cache.delete(cache.keys().next().value);
    cache.set(key, pool);
  }
  if (!pool.length) return { names: [], total: 0, batch: 0, analysis, surname };
  const pages = Math.ceil(pool.length / 10),
    page = batch % pages;
  return {
    names: Array.from(
      { length: Math.min(10, pool.length) },
      (_, i) => pool[(page * 10 + i) % pool.length],
    ),
    total: pool.length,
    batch: page,
    pages,
    analysis,
    surname,
  };
}

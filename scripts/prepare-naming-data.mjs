// 一次性整理脚本：从已取得的公有领域诗句中筛选240条；运行时不联网。
import { readFile, writeFile } from "node:fs/promises";
import { pinyin } from "pinyin-pro";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import * as OpenCC from "opencc-js";
const root = new URL("../", import.meta.url),
  convert = OpenCC.Converter({ from: "tw", to: "cn" });
const sourceManifest = JSON.parse(
  await readFile(new URL("data/naming/source-manifest.json", root), "utf8"),
);
async function readPoetry(id) {
  const metadata = sourceManifest.find((s) => s.id === id);
  let raw;
  if (process.argv[2])
    raw = await readFile(resolve(process.argv[2], id + ".json"));
  else {
    const response = await fetch(metadata.url);
    if (!response.ok) throw Error("无法读取诗词来源：" + id);
    raw = Buffer.from(await response.arrayBuffer());
  }
  if (createHash("sha256").update(raw).digest("hex") !== metadata.sha256)
    throw Error("来源内容变化，请人工核对后更新清单：" + id);
  return raw.toString("utf8");
}
const raw = await readFile(
    new URL("data/naming/character-notes.txt", root),
    "utf8",
  ),
  chars = [],
  seen = new Set();
const overrides = {
  乐: ["lè", 4],
  柏: ["bǎi", 3],
  行: ["xíng", 2],
  和: ["hé", 2],
  晟: ["shèng", 4],
  玟: ["mín", 2],
  朝: ["zhāo", 1],
  长: ["cháng", 2],
  莞: ["wǎn", 3],
  蔓: ["màn", 4],
};
const female = new Set("婉媛嫣倩姝姗姿芷蕊薇茜莞菡菲瑶璇妍莹滢玥彤"),
  male = new Set("俊杰峻岳铠钧毅刚勇勋翰轩铭灏武峥腾栋");
const common = new Set(
  "子一予亦可如君安宁清和知言书文思若之怀沐雨云星辰明昕晗晴晨涵淳景行修齐嘉宜欣悦颖希诺然远悠珂玉瑾瑜琛琪琳瑶林梓桐楠森竹芷兰萱芸蔚棠溪洛泽舟帆川青静舒新承正宇宸昊博彦俊祺瑞熙煦昭望易",
);
for (const line of raw.trim().split("\n")) {
  const [element, text] = line.split("|");
  for (const entry of text.split(/\s+/)) {
    if (!entry) continue;
    let [char, meaning] = entry.split(":");
    char = convert(char);
    if (seen.has(char)) continue;
    const py = overrides[char]?.[0] || pinyin(char),
      tone =
        overrides[char]?.[1] ||
        Number(pinyin(char, { toneType: "num" }).match(/[1-4]/)?.[0]);
    if (!tone) continue;
    seen.add(char);
    chars.push({
      char,
      pinyin: py,
      tone,
      plain: py
        .replace(/[ǖǘǚǜü]/g, "v")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
      element,
      meaning,
      gender: female.has(char) ? "female" : male.has(char) ? "male" : "neutral",
      common: common.has(char),
    });
  }
}
if (chars.length < 500 || chars.length > 800)
  throw Error("字库数量不符:" + chars.length);
await writeFile(
  new URL("data/naming/characters.json", root),
  JSON.stringify(chars, null, 2) + "\n",
);
const sources = [
    ["shijing", "诗经"],
    ["chuci", "楚辞"],
    ["tang", "唐诗"],
    ["song", "宋词"],
  ],
  poems = [],
  quoteSet = new Set(),
  bad = /[死杀哭怨哀丧恨伤病墓血战贫残魂泣愁寡仇辱奴贱]/;
const preferred = [
  "静姝",
  "静好",
  "清扬",
  "子衿",
  "子宁",
  "嘉树",
  "若华",
  "景行",
  "思齐",
  "文茵",
  "柔嘉",
  "如英",
  "攸宁",
  "徽音",
  "令仪",
  "柔惠",
  "淑慎",
  "佩玖",
  "琼琚",
  "琼瑶",
  "琼玖",
  "怀瑾",
  "瑾瑜",
  "望舒",
  "宜修",
  "芳芷",
  "云旗",
  "辰星",
  "沐芳",
  "怀信",
  "清和",
  "悠然",
  "云帆",
  "星辰",
  "知意",
  "明月",
  "清欢",
  "南风",
  "新雨",
];
for (const [file, collection] of sources) {
  const items = JSON.parse(await readPoetry(file)),
    available = [];
  for (const item of items)
    for (const line of item.content || item.paragraphs || []) {
      const quote = convert(line).trim(),
        eligible = [...new Set([...quote].filter((c) => seen.has(c)))];
      if (
        quote.length < 6 ||
        quote.length > 38 ||
        bad.test(quote) ||
        eligible.length < 3
      )
        continue;
      available.push({
        collection,
        title: convert(item.title || item.rhythmic || item.section || "佚题"),
        author: convert(item.author || "佚名"),
        quote,
        originalQuote: line,
        characters: eligible,
        quality:
          preferred.filter((p) => quote.includes(p)).length * 100 +
          eligible.filter((c) => common.has(c)).length,
      });
    }
  available.sort((a, b) => b.quality - a.quality);
  const perTitle = new Map();
  let count = 0;
  for (const item of available) {
    const key = item.author + item.title;
    if (quoteSet.has(item.quote) || (perTitle.get(key) || 0) >= 2) continue;
    perTitle.set(key, (perTitle.get(key) || 0) + 1);
    quoteSet.add(item.quote);
    delete item.quality;
    poems.push({
      ...item,
      id: `poem${String(poems.length + 1).padStart(3, "0")}`,
      source: `chinese-poetry/chinese-poetry：${collection}选本（公有领域原文，繁简转换）`,
    });
    if (++count === 60) break;
  }
  if (count < 60) throw Error(collection + "不足60条:" + count);
}
await writeFile(
  new URL("data/naming/poems.json", root),
  JSON.stringify(poems, null, 2) + "\n",
);
const surnameNames =
  "赵 钱 孙 李 周 吴 郑 王 冯 陈 褚 卫 蒋 沈 韩 杨 朱 秦 尤 许 何 吕 施 张 孔 曹 严 华 金 魏 陶 姜 戚 谢 邹 喻 柏 水 窦 章 云 苏 潘 葛 奚 范 彭 郎 鲁 韦 昌 马 苗 凤 花 方 俞 任 袁 柳 鲍 史 唐 费 廉 岑 薛 雷 贺 倪 汤 滕 殷 罗 毕 郝 邬 安 常 乐 于 傅 皮 卞 齐 康 伍 余 元 卜 顾 孟 平 黄 和 穆 萧 尹 姚 邵 湛 汪 祁 毛 禹 狄 米 贝 明 臧 计 伏 成 戴 宋 茅 庞 熊 纪 舒 屈 项 祝 董 梁 杜 阮 蓝 闵 席 季 麻 强 贾 路 娄 危 江 童 颜 郭 梅 盛 林 钟 徐 邱 骆 高 夏 蔡 田 胡 廖 黎 叶 文 易 程 单 解 曾 查 区 仇 欧阳 司马 诸葛 上官 夏侯 东方 尉迟 长孙 皇甫 慕容 宇文 令狐 司徒 公孙".split(
    " ",
  );
const surnameOverrides = {
  单: "shàn",
  解: "xiè",
  曾: "zēng",
  查: "zhā",
  区: "ōu",
  仇: "qiú",
  乐: "yuè",
  尉迟: "yù chí",
  长孙: "zhǎng sūn",
};
const toneOf = (s) =>
  /[āēīōūǖ]/.test(s)
    ? 1
    : /[áéíóúǘ]/.test(s)
      ? 2
      : /[ǎěǐǒǔǚ]/.test(s)
        ? 3
        : /[àèìòùǜ]/.test(s)
          ? 4
          : 0;
const surnames = surnameNames.map((name) => {
  const py = surnameOverrides[name] || pinyin(name, { surname: "all" });
  return {
    name,
    pinyin: py,
    tones: py.split(" ").map(toneOf),
    plain: py
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replaceAll("ü", "v")
      .replaceAll(" ", ""),
  };
});
await writeFile(
  new URL("data/naming/surnames.json", root),
  JSON.stringify(surnames, null, 2) + "\n",
);
console.log({
  characters: chars.length,
  poems: poems.length,
  surnames: surnames.length,
});

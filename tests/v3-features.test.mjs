import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { figures, groups, DATA_VERSION } from "../site/shared/history.js";
import {
  encodePartner,
  decodePartner,
  pairReport,
  pairs,
  partnerLink,
} from "../site/apps/pair/core.js";
import {
  dailyQuestion,
  initialDaily,
  answerDaily,
  winStreak,
  validateDaily,
} from "../site/apps/daily/core.js";
import {
  allPeople,
  allEdges,
  layoutGraph,
  manual,
} from "../site/apps/network/core.js";
import {
  characters,
  poems,
  surnames,
  generateNames,
  soundCheck,
  surnameInfo,
} from "../site/apps/names/core.js";
import { parseCivilTime, elementReference } from "../site/shared/calendar.js";
import {
  hexagrams,
  byLines,
  coinsResult,
  coinThrow,
  timeResult,
} from "../site/apps/reflection/core.js";
import { shanghaiDate } from "../site/shared/storage.js";

test("双人八维边界、对称性与摘要校验；损坏结构和旧链接被拒绝", () => {
  const a = [1, 1, 1, 1, 1, 1, 1, 1],
    b = Array(8).fill(10);
  assert.equal(pairReport(a, a).similarity, 100);
  assert.equal(pairReport(a, a).close, 8);
  assert.equal(pairReport(a, b).similarity, 0);
  assert.equal(pairReport(a, b).close, 0);
  assert.equal(pairReport(a, b).similarity, pairReport(b, a).similarity);
  assert.equal(pairs.length, 18);
  const url = new URL(
    partnerLink(figures[0].vec, "https://example.com/apps/portrait/index.html"),
  );
  assert.equal(url.search, "");
  assert(url.hash.startsWith("#a="));
  const token = encodePartner(figures[0].vec),
    decoded = decodePartner(token);
  assert.equal(decoded.data, DATA_VERSION);
  assert.equal(decoded.vec.length, 8);
  assert(
    !atob(token.replaceAll("-", "+").replaceAll("_", "/")).includes("answers"),
  );
  assert.throws(() => decodePartner("broken!"));
  assert.throws(() => encodePartner([1, 2]));
  assert.throws(() =>
    decodePartner(btoa(JSON.stringify({ ...decoded, data: "old" }))),
  );
  assert.throws(() =>
    decodePartner(btoa(JSON.stringify({ ...decoded, id: "unknown" }))),
  );
});
test("北京时间午夜换题、50天无重复、四选项唯一且同组", () => {
  assert.equal(shanghaiDate(new Date("2026-10-29T15:59:59Z")), "2026-10-29");
  assert.equal(shanghaiDate(new Date("2026-10-29T16:00:00Z")), "2026-10-30");
  const seen = new Set();
  for (let i = 0; i < 50; i++) {
    const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      q = dailyQuestion(date);
    seen.add(q.figure.id);
    assert.equal(new Set(q.options.map((o) => o.id)).size, 4);
    assert(q.options.every((o) => o.group === q.figure.group));
    assert(q.options.some((o) => o.id === q.figure.id));
    assert.equal(dailyQuestion(date).figure.id, q.figure.id);
  }
  assert.equal(seen.size, 50);
  assert.throws(() => dailyQuestion("2026-02-30"));
});
test("每日答错提示后可答对，三日解锁且重复提交不刷记录；断日重置", () => {
  let s = initialDaily();
  for (const date of ["2026-10-28", "2026-10-29", "2026-10-30"]) {
    const q = dailyQuestion(date),
      wrong = q.options.find((f) => f.id !== q.figure.id);
    let r = answerDaily(s, date, wrong.id);
    assert(!r.correct);
    r = answerDaily(r.state, date, q.figure.id);
    s = r.state;
  }
  assert.equal(winStreak(s.days, "2026-10-30"), 3);
  assert.equal(s.unlocked.length, 1);
  const same = answerDaily(
    s,
    "2026-10-30",
    dailyQuestion("2026-10-30").figure.id,
  );
  assert(same.already);
  assert.equal(same.state.unlocked.length, 1);
  const after = answerDaily(
    s,
    "2026-11-01",
    dailyQuestion("2026-11-01").figure.id,
  );
  assert.equal(after.streak, 1);
  assert.equal(validateDaily({}).unlocked.length, 0);
  assert.equal(
    validateDaily({ version: "daily-v1-50", days: null, unlocked: [] }).unlocked
      .length,
    0,
  );
});
test("图谱边端点完整，100条自动同类和手工关系明确分型；D3布局有限且不漏人", () => {
  assert.equal(figures.length, 50);
  const ids = new Set(allPeople.map((f) => f.id));
  for (const e of allEdges()) {
    assert(ids.has(e.source), e.source);
    assert(ids.has(e.target), e.target);
    assert(["cohort", "partner", "rival", "analogy"].includes(e.type));
    assert(e.note.length > 0);
  }
  assert.equal(allEdges().filter((e) => e.type === "cohort").length, 100);
  assert(manual.filter((e) => e.type === "rival").length >= 20);
  const graph = layoutGraph();
  assert.equal(graph.nodes.length, allPeople.length);
  assert(
    graph.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y)),
  );
});
test("起名字库、240句出处和姓氏标注完整；引用均确实含取用字", () => {
  assert(characters.length >= 500 && characters.length <= 800);
  assert.equal(new Set(characters.map((c) => c.char)).size, characters.length);
  for (const c of characters) {
    assert(c.meaning);
    assert(c.pinyin);
    assert([1, 2, 3, 4].includes(c.tone));
    assert(["金", "木", "水", "火", "土"].includes(c.element));
  }
  assert(poems.length >= 200 && poems.length <= 300);
  assert.equal(new Set(poems.map((p) => p.quote)).size, poems.length);
  for (const p of poems) {
    assert(p.title && p.author && p.source);
    assert(p.characters.every((c) => p.quote.includes(c)));
  }
  assert(surnames.length >= 100);
  assert.equal(surnameInfo("单").pinyin, "shàn");
  assert.equal(surnameInfo("欧阳").tones.length, 2);
  assert.equal(surnameInfo("祁", "qi2").plain, "qi");
  assert.equal(surnameInfo("单", "shan4").tones[0], 4);
  assert.throws(() => surnameInfo("祁", "qi"));
  assert.throws(() => surnameInfo("欧阳", "ou1"));
});
test("名字各风格有10个独立候选，换批非重复；母姓与有效谐音规则生效", () => {
  for (const style of ["ancient", "modern", "neutral", "shijing", "chuci"]) {
    const input = {
        surname: "林",
        mother: "",
        gender: "any",
        birth: "",
        style,
        includeMother: false,
      },
      a = generateNames(input),
      b = generateNames(input, 1);
    assert.equal(a.names.length, 10);
    assert.equal(new Set(a.names.map((n) => n.name)).size, 10);
    assert(!a.names.some((n) => b.names.some((x) => x.name === n.name)));
    for (const n of a.names) {
      assert(n.name.startsWith("林"));
      assert.equal(n.chars.length, 2);
      if (n.source) {
        const i = n.source.quote.indexOf(n.chars[0].char),
          j = n.source.quote.indexOf(n.chars[1].char, i + 1);
        assert(i >= 0 && j > i);
      }
      if (["shijing", "chuci"].includes(style))
        assert(
          a.names.every(
            (n) =>
              n.source.collection === (style === "shijing" ? "诗经" : "楚辞"),
          ),
        );
    }
  }
  const input = {
    surname: "张",
    mother: "林",
    gender: "any",
    birth: "2024-02-10T12:00",
    style: "modern",
    includeMother: true,
  };
  assert(generateNames(input).names.every((n) => n.given.includes("林")));
  assert.throws(() => generateNames({ ...input, surname: "<script>" }));
  assert.throws(() => generateNames({ ...input, mother: "" }));
  assert.equal(
    soundCheck(
      { tones: [1], plain: "li" },
      { char: "青", plain: "qing", tone: 1 },
      { char: "芳", plain: "fang", tone: 1 },
    ),
    null,
  );
});
test("历法八字表层计数等于8，日期非法时拒绝；年界使用节气而非公历1月1日", () => {
  const r = elementReference("2024-02-10T12:00");
  assert.deepEqual(r.pillars, ["甲辰", "丙寅", "甲辰", "庚午"]);
  assert.equal(
    Object.values(r.counts).reduce((a, b) => a + b, 0),
    8,
  );
  assert.throws(() => parseCivilTime("2024-02-30T12:00"));
  assert.throws(() => parseCivilTime("1800-01-01T12:00"));
  assert.equal(elementReference("2024-01-01T12:00").pillars[0], "癸卯");
});
test("64卦唯一且从下往上映射正确；小过雷上山下", () => {
  assert.equal(hexagrams.length, 64);
  assert.equal(new Set(hexagrams.map((h) => h.lines.join(""))).size, 64);
  assert.equal(byLines([1, 1, 1, 1, 1, 1]).number, 1);
  assert.equal(byLines([0, 0, 0, 0, 0, 0]).number, 2);
  assert.equal(byLines([0, 0, 1, 1, 0, 0]).number, 62);
  for (const h of hexagrams) {
    assert.equal(h.questions.length, 3);
    assert(h.tip.length <= 20);
    assert(h.action.length > 5);
  }
  assert.equal(new Set(hexagrams.map((h) => h.tip)).size, 64);
});
test("三钱六掷覆盖6/7/8/9、老阴阳翻转；时间法确定且不伪造分钟差异", () => {
  assert.equal(coinThrow(() => 0).total, 6);
  assert.equal(coinThrow(() => 0.99).total, 9);
  assert.throws(() => coinThrow(() => 1));
  const r = coinsResult([6, 7, 8, 9, 6, 7]);
  assert.deepEqual(r.lines, [0, 1, 0, 1, 0, 1]);
  assert.deepEqual(r.moving, [1, 4, 5]);
  assert.equal(r.changed.lines[0], 1);
  assert.equal(r.changed.lines[3], 0);
  assert.throws(() => coinsResult([6, 7]));
  assert.deepEqual(
    timeResult("2024-02-10T12:00"),
    timeResult("2024-02-10T12:00"),
  );
  assert.equal(
    timeResult("2024-02-10T12:59").main.number,
    timeResult("2024-02-10T12:00").main.number,
  );
});
test("首页六个功能都有真实子页入口，构建后均存在", () => {
  const html = readFileSync(
    new URL("../site/index.html", import.meta.url),
    "utf8",
  );
  for (const slug of [
    "portrait",
    "pair",
    "daily",
    "network",
    "names",
    "reflection",
  ]) {
    assert(html.includes(`apps/${slug}/index.html`));
    assert(
      existsSync(new URL(`../dist/apps/${slug}/index.html`, import.meta.url)),
    );
  }
});

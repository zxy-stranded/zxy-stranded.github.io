import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import {
  figures,
  groups,
  questions,
  dimensions,
  DATA_VERSION,
  questionIds,
  scoreAnswers,
  rankFigures,
  buildResult,
  agreement,
  isValidSession,
  invitationUrl,
} from "../site/apps/portrait/src/engine.js";
const sessionFor = (mode = "full", pick = 0) => ({
  version: DATA_VERSION,
  mode,
  index: 0,
  answers: Object.fromEntries(
    questionIds(mode).map((id) => [
      id,
      questions.find((q) => q.id === id).options[pick].id,
    ]),
  ),
});
test("50人、10组、8维和30题完整且无旧版混入", () => {
  assert.equal(figures.length, 50);
  assert.equal(groups.length, 10);
  assert.equal(questions.length, 30);
  assert.equal(dimensions.length, 8);
  for (const field of ["id", "name", "verdict", "contrast", "bio"])
    assert.equal(
      new Set(figures.map((f) => f[field])).size,
      50,
      `${field} 必须独立`,
    );
  for (const g of groups)
    assert.equal(figures.filter((f) => f.group === g.id).length, 5);
  for (const f of figures) {
    assert.equal(f.vec.length, 8);
    assert(f.vec.every((v) => Number.isFinite(v) && v >= 1 && v <= 10));
    assert.equal(f.evidence.length, 8);
    assert(f.evidence.every((e) => typeof e === "string" && e.length > 5));
    assert(f.choices.length >= 2);
    assert(f.bio.length <= 100);
    assert(f.source.length > 3);
    for (const q of questions)
      assert(
        q.options.some((o) =>
          [f.tendencies[q.category]].flat().includes(o.direction),
        ),
      );
  }
  for (const q of questions) {
    assert.equal(q.options.length, 4);
    assert.equal(q.weights.length, 8);
    assert(q.weights.every((v) => v >= 0));
    assert(q.weights.some((v) => v > 0));
    for (const o of q.options) {
      assert.equal(o.vec.length, 8);
      assert(o.vec.every((v) => v >= 1 && v <= 10));
    }
  }
  for (const category of new Set(questions.map((q) => q.category)))
    assert.equal(questions.filter((q) => q.category === category).length, 5);
  const size = gzipSync(
    Buffer.from(JSON.stringify({ figures, questions, groups })),
  ).length;
  assert(size < 100 * 1024);
  console.log(`数据压缩后 ${(size / 1024).toFixed(1)} KiB`);
});
test("极速版固定15题，六类均有覆盖，每维都有有效权重", () => {
  const ids = questionIds("quick");
  assert.equal(ids.length, 15);
  assert.equal(new Set(ids).size, 15);
  for (const cat of new Set(questions.map((q) => q.category)))
    assert(
      ids.filter((id) => questions.find((q) => q.id === id).category === cat)
        .length >= 2,
    );
  for (let d = 0; d < 8; d++)
    assert(
      ids.reduce(
        (sum, id) => sum + questions.find((q) => q.id === id).weights[d],
        0,
      ) > 0,
    );
});
test("计分与按题目可达区间校正的独立计算一致；不完整和非法输入拒绝生成结果", () => {
  const s = sessionFor("full", 2),
    ids = questionIds("full"),
    actual = scoreAnswers(ids, s.answers);
  for (let d = 0; d < 8; d++) {
    let total = 0,
      weight = 0;
    for (const q of questions) {
      const minimum = Math.min(...q.options.map((o) => o.vec[d])),
        maximum = Math.max(...q.options.map((o) => o.vec[d]));
      total += (q.options[2].vec[d] - minimum) * q.weights[d];
      weight += (maximum - minimum) * q.weights[d];
    }
    assert.equal(actual[d], 1 + (9 * total) / weight);
  }
  delete s.answers.q01;
  assert.throws(() => buildResult(s));
  assert.throws(() => rankFigures([1, 2]));
  assert.throws(() => rankFigures(Array(8).fill(NaN)));
});
test("全部人物均参与欧氏距离比较；各人物的独立向量能识别回自身", () => {
  for (const f of figures) {
    const best = rankFigures(f.vec)[0];
    assert.equal(best.distance, 0);
    assert.equal(best.figure.id, f.id, `${f.name}向量不能与他人重合`);
    assert.equal(best.similarity, 100);
  }
  let seed = 771;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let k = 0; k < 1000; k++) {
    const s = sessionFor(k % 2 ? "quick" : "full");
    for (const id of questionIds(s.mode))
      s.answers[id] = "ABCD"[Math.floor(rnd() * 4)];
    const r = buildResult(s);
    const independently = figures.map((f) =>
      Math.sqrt(f.vec.reduce((sum, v, d) => sum + (v - r.vec[d]) ** 2, 0)),
    );
    assert(Math.abs(r.primary.distance - Math.min(...independently)) < 1e-12);
    assert.equal(r.secondary.length, 2);
    assert.equal(buildResult(s).primary.figure.id, r.primary.figure.id);
  }
});
test("吻合题数逐题从情境方向统计，不从匹配百分比换算", () => {
  for (const mode of ["full", "quick"]) {
    const s = sessionFor(mode, 0),
      r = buildResult(s),
      f = r.primary.figure,
      ids = questionIds(mode);
    const expected = ids.filter((id) => {
      const q = questions.find((q) => q.id === id);
      return [f.tendencies[q.category]].flat().includes(0);
    }).length;
    assert.equal(r.count, expected);
    assert.equal(r.total, ids.length);
    assert.equal(r.details.length, ids.length);
    assert.equal(
      r.count,
      agreement(f, ids, s.answers).filter((x) => x.aligned).length,
    );
  }
  const s = sessionFor("full"),
    before = buildResult(s);
  s.answers.q01 = "D";
  assert.notDeepEqual(scoreAnswers(questionIds("full"), s.answers), before.vec);
});
test("恢复只接纳当前题库的合法状态；旧版与损坏进度不会被误用", () => {
  assert(isValidSession(sessionFor()));
  assert(!isValidSession({}));
  assert(!isValidSession({ ...sessionFor(), version: "old" }));
  assert(!isValidSession({ ...sessionFor(), index: -1 }));
  assert(!isValidSession({ ...sessionFor(), answers: { q01: "bad" } }));
  assert(!isValidSession({ ...sessionFor("quick"), answers: { q02: "A" } }));
});
test("邀请链接不携带私人答卷，根站点和项目子路径均保持正确地址", () => {
  for (const root of [
    "https://zxy-stranded.github.io/",
    "https://example.com/my-web/",
  ]) {
    const url = new URL(
      invitationUrl("sushi", root + "apps/portrait/index.html?old=1#/result"),
    );
    assert.equal(
      url.pathname,
      new URL(root).pathname + "apps/portrait/index.html",
    );
    assert.equal(url.hash, "#/invite/sushi");
    assert.equal(url.search, "");
  }
  assert.throws(() => invitationUrl("unknown", "https://example.com/"));
});
test("50位人物都能由真实30题答卷匹配到，不只是直接喂入人物向量", () => {
  const witnesses = JSON.parse(
    readFileSync(
      new URL("./fixtures/reachable-50.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(Object.keys(witnesses).length, 50);
  for (const f of figures) {
    const session = {
      version: DATA_VERSION,
      mode: "full",
      index: 29,
      answers: witnesses[f.id],
    };
    assert(isValidSession(session));
    assert.equal(
      buildResult(session).primary.figure.id,
      f.id,
      `${f.name}须有真实答卷可触达`,
    );
  }
});

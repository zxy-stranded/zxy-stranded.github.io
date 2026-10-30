import test from "node:test";
import assert from "node:assert/strict";
import {
  DATA_VERSION,
  questionIds,
  buildResult,
  figures,
  invitationUrl,
} from "../site/apps/portrait/src/engine.js";
import {
  encodeResultBackup,
  decodeResultBackup,
  resultBackupUrl,
  isWeChatBrowser,
} from "../site/apps/portrait/src/result-backup.js";
import { encodePartner } from "../site/apps/pair/core.js";
const sample = (mode) => ({
  version: DATA_VERSION,
  mode,
  index: 0,
  answers: Object.fromEntries(
    questionIds(mode).map((id, i) => [id, "ABCD"[i % 4]]),
  ),
});
const packed = (obj) =>
  btoa(JSON.stringify(obj))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

test("结果恢复保留15/30题的每道答案、八维、人物及吻合数，不依赖本地存储", () => {
  for (const mode of ["quick", "full"]) {
    const original = sample(mode),
      token = encodeResultBackup(original),
      restored = decodeResultBackup(token);
    assert.deepEqual(restored.answers, original.answers);
    const { createdAt: restoredTime, ...restoredReport } =
      buildResult(restored);
    const { createdAt: originalTime, ...originalReport } =
      buildResult(original);
    assert(Number.isFinite(restoredTime) && Number.isFinite(originalTime));
    assert.deepEqual(restoredReport, originalReport);
    assert.equal(restored.index, questionIds(mode).length - 1);
    assert(token.length < 300);
    assert.match(token, /^[A-Za-z0-9_-]+$/);
  }
});
test("未完成、无效题目和非法选项不能生成恢复地址", () => {
  const s = sample("full");
  delete s.answers[questionIds("full")[0]];
  assert.throws(() => encodeResultBackup(s));
  s.answers.extra = "A";
  assert.throws(() => encodeResultBackup(s));
  assert.throws(() => encodeResultBackup(null));
});
test("恢复拒绝损坏、超长、旧版本与长度不匹配数据，未知字段不注入会话", () => {
  const valid = JSON.parse(atob(encodeResultBackup(sample("full"))));
  for (const token of [
    "broken!",
    "a".repeat(2001),
    "",
    null,
    ["abc"],
    packed(null),
    packed({ ...valid, v: 2 }),
    packed({ ...valid, d: "old" }),
    packed({ ...valid, m: "unknown" }),
    packed({ ...valid, a: "A".repeat(29) }),
    packed({ ...valid, a: "X".repeat(30) }),
  ])
    assert.throws(() => decodeResultBackup(token));
  const restored = decodeResultBackup(
    packed({ ...valid, secret: "ignore", index: 999, answers: {} }),
  );
  assert(!("secret" in restored));
  assert.equal(Object.keys(restored.answers).length, 30);
});
test("双人邀请上下文随完整版恢复，错误摘要及极速版双人上下文拒绝", () => {
  const s = sample("full");
  s.pairInvite = encodePartner(figures[0].vec);
  s.returnPair = true;
  const decoded = decodeResultBackup(encodeResultBackup(s));
  assert.equal(decoded.pairInvite, s.pairInvite);
  assert(decoded.returnPair);
  const quick = JSON.parse(atob(encodeResultBackup(sample("quick"))));
  assert.throws(() =>
    decodeResultBackup(packed({ ...quick, p: s.pairInvite })),
  );
  assert.throws(() =>
    decodeResultBackup(
      packed({ ...JSON.parse(atob(encodeResultBackup(s))), p: "broken!" }),
    ),
  );
});
test("恢复地址只使用片段，支持仓库子路径；对外人物邀请不泄漏答案", () => {
  for (const prefix of ["", "/my-web"]) {
    const url = new URL(
      resultBackupUrl(
        sample("quick"),
        `https://example.com${prefix}/apps/portrait/index.html?r=sushi#/result`,
      ),
    );
    assert.equal(url.pathname, `${prefix}/apps/portrait/index.html`);
    assert.equal(url.search, "");
    const token = new URLSearchParams(url.hash.split("?")[1]).get("restore");
    assert.deepEqual(
      decodeResultBackup(token).answers,
      sample("quick").answers,
    );
    const invite = new URL(invitationUrl("sushi", url.href));
    assert(!invite.href.includes("restore="));
    assert(invite.hash.endsWith("/invite/sushi"));
  }
});
test("微信客户端识别兼容大小写，不误判普通浏览器", () => {
  assert(isWeChatBrowser("Mozilla/5.0 iPhone MicroMessenger/8.0.64"));
  assert(isWeChatBrowser("Android micromessenger/8"));
  assert(!isWeChatBrowser("Mozilla/5.0 Chrome/130 Safari/537.36"));
});

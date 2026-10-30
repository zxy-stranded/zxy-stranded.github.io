import { DATA_VERSION, isValidSession, questionIds } from "./engine.js";
import { decodePartner } from "../../pair/core.js";

const isComplete = (s) =>
  isValidSession(s) && questionIds(s.mode).every((id) => s.answers[id]);
const encode = (value) =>
  btoa(JSON.stringify(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

export function encodeResultBackup(session) {
  if (!isComplete(session)) throw Error("答题完成后才能保存结果地址");
  const payload = {
    v: 1,
    d: DATA_VERSION,
    m: session.mode,
    a: questionIds(session.mode)
      .map((id) => session.answers[id])
      .join(""),
  };
  if (session.pairInvite) {
    if (session.mode !== "full") throw Error("双人报告需使用完整版");
    decodePartner(session.pairInvite);
    payload.p = session.pairInvite;
  }
  if (session.returnPair) payload.r = true;
  return encode(payload);
}

export function decodeResultBackup(token) {
  try {
    if (
      typeof token !== "string" ||
      !token.length ||
      token.length > 2000 ||
      !/^[A-Za-z0-9_-]+$/.test(token)
    )
      throw Error();
    const base = token.replaceAll("-", "+").replaceAll("_", "/");
    const p = JSON.parse(atob(base + "=".repeat((4 - (base.length % 4)) % 4)));
    if (
      !p ||
      p.v !== 1 ||
      p.d !== DATA_VERSION ||
      !["quick", "full"].includes(p.m)
    )
      throw Error();
    const ids = questionIds(p.m);
    if (
      typeof p.a !== "string" ||
      p.a.length !== ids.length ||
      !/^[ABCD]+$/.test(p.a)
    )
      throw Error();
    const session = {
      version: DATA_VERSION,
      mode: p.m,
      index: ids.length - 1,
      answers: Object.fromEntries(ids.map((id, i) => [id, p.a[i]])),
    };
    if (p.p !== undefined) {
      if (p.m !== "full") throw Error();
      decodePartner(p.p);
      session.pairInvite = p.p;
    }
    if (p.r === true || p.p) session.returnPair = true;
    if (!isComplete(session)) throw Error();
    return session;
  } catch {
    throw Error(
      "结果恢复地址无效或题库版本已更新，请回到原浏览器重新复制结果地址",
    );
  }
}

export function resultBackupUrl(session, href) {
  const url = new URL(href);
  url.search = "";
  url.hash = "/result?restore=" + encodeResultBackup(session);
  return url.href;
}

export const isWeChatBrowser = (ua = "") => /MicroMessenger/i.test(ua);

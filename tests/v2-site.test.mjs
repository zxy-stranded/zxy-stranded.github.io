import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
const root = resolve(import.meta.dirname, "..");
test("功能站首页链接与新口径一致，没有500人旧资源", () => {
  const home = readFileSync(resolve(root, "site/index.html"), "utf8");
  assert(home.includes("apps/portrait/index.html"));
  assert(!home.includes("500"));
  const workflow = readFileSync(
    resolve(root, ".github/workflows/pages.yml"),
    "utf8",
  );
  assert(workflow.includes("npm ci"));
  assert(workflow.includes("npm run build"));
  assert(workflow.includes("path: dist"));
  assert(!existsSync(resolve(root, "data/people.json")));
});
test("正式构建包含正确多页面入口、hash路由清单与全部本地资源", () => {
  for (const rel of [
    "index.html",
    "apps/portrait/index.html",
    "apps/portrait/404.html",
    "apps/portrait/icon.svg",
    "apps/portrait/manifest.webmanifest",
  ])
    assert(existsSync(resolve(root, "dist", rel)), rel);
  for (const rel of ["index.html", "apps/portrait/index.html"]) {
    const html = readFileSync(resolve(root, "dist", rel), "utf8");
    for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (url.startsWith("#") || /^[a-z]+:/i.test(url)) continue;
      assert(!url.startsWith("/"), "静态资产使用相对路径");
      assert(existsSync(resolve(root, "dist", dirname(rel), url)), url);
    }
  }
  const manifest = JSON.parse(
    readFileSync(
      resolve(root, "dist/apps/portrait/manifest.webmanifest"),
      "utf8",
    ),
  );
  assert.equal(manifest.start_url, "./#/");
  assert.equal(manifest.display, "standalone");
  const js = readdirSync(resolve(root, "dist/assets"))
    .filter((x) => x.endsWith(".js"))
    .map((x) => readFileSync(resolve(root, "dist/assets", x), "utf8"))
    .join("");
  assert(!js.includes("PORTRAIT_PEOPLE"));
  assert(js.includes("portrait-v2-50-30-20261030"));
});

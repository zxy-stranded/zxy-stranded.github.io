import { copyFile, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
// 个人站点根目录保留功能首页；404页面提供一个不会依赖错误相对路径的返回入口。
await writeFile(
  root + "dist/404.html",
  `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>观己 · 页面未找到</title><style>body{background:#f4f2eb;color:#365d44;font:16px/2 sans-serif;max-width:600px;margin:15vh auto;padding:25px}a{color:inherit}</style></head><body><h1>这条小路暂时没有抵达。</h1><p>人物测试使用带 # 的链接。可以从功能首页重新开始。</p><a href="/">返回功能首页 →</a></body></html>`,
);
// 深层路径兜底使用相同内容，hash路由的正常刷新始终请求该入口。
await copyFile(
  root + "dist/apps/portrait/index.html",
  root + "dist/apps/portrait/404.html",
);
await writeFile(root + "dist/.nojekyll", "");
const index = await readFile(root + "dist/index.html", "utf8");
if (!index.includes("apps/portrait/index.html"))
  throw new Error("功能首页缺少人物画像入口");
console.log("已生成静态多页面产物、404兜底和主屏幕清单。");

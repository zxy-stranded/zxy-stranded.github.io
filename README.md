# 观己 · 自我探索工具站

站点首页为功能列表，目前包含历史人物画像。双击 `dist/index.html` 即可本地使用；复制时请一起复制整个 `dist` 文件夹。线上目标地址为 `https://zxy-stranded.github.io/`，人物画像独立地址为 `https://zxy-stranded.github.io/apps/portrait/`。

## 文件

- `dist/index.html`：功能列表首页。
- `dist/assets/site.css`：站点首页样式。
- `dist/apps/portrait/index.html`：人物画像入口。
- `dist/apps/portrait/style.css`：人物画像响应式样式。
- `dist/apps/portrait/app.js`：答题、八维计分、500 人最近邻匹配、结果与图片下载。
- `data/people.json`：人物资料的唯一维护源，500 条完整独立记录。
- `dist/apps/portrait/people-data.js`：从 JSON 自动生成的浏览器数据文件，不手工维护。通过普通脚本加载，避免双击本地 HTML 时 `fetch` 读取 JSON 的跨源限制。
- `scripts/sync-people.py`：检查配置并同步浏览器数据。
- `tests/matching.cjs`：配置、最近邻、独立计算和稳定性校验。

## GitHub Pages 发布

此仓库使用 GitHub Actions 发布 `dist/`，不需要把网站文件移到仓库根目录。

1. 将完整项目提交到 `zxy-stranded/zxy-stranded.github.io` 仓库的默认分支（目前是 `master`）。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
3. 在 **Actions → Check and deploy website** 中查看构建结果；若首次启用时没有触发，点击 **Run workflow**。
4. 成功后访问 `https://zxy-stranded.github.io/`。本地完成不代表已经上线，以 Actions 部署结果为准。

工作流会自动从 JSON 生成浏览器数据、检查静态链接、检查 JavaScript 并运行匹配测试，通过后才发布。Pull Request 只检查，不部署；仅默认分支部署。公开站点中的脚本与人物数据可被访问，不在项目中存放密钥。

发布机制参考 [GitHub Pages 官方工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 后续新增功能

当前采用无框架的多页面静态站点。每个功能有自己的 HTML、CSS 和 JS，不相互加载代码；功能之间使用普通链接，可独立访问与刷新，无需配置服务端路由。所有站内地址都用相对路径，兼容仓库子路径。

```text
.github/workflows/pages.yml   # 检查与部署流程
dist/                        # 唯一发布目录
  index.html                 # 功能列表
  assets/site.css            # 首页样式
  apps/
    portrait/                # 现有功能
      index.html
      style.css
      app.js
      people-data.js         # 自动生成
    <新功能名>/              # 后续按功能新增目录
      index.html
      style.css
      app.js
data/people.json             # 人物资料维护源
scripts/                     # 生成与校验
tests/                       # 测试
```

增加功能时，在 `dist/apps/` 下建立独立目录，再给 `dist/index.html` 增加一张链接卡片即可。新页面返回功能首页的地址为 `../../index.html`。新功能的浏览器存储键使用独立前缀，避免相互覆盖。

当前不需要 React、Vue 或路由框架。若后续出现大量共享交互组件，再引入轻量构建工具；登录、跨设备记录、支付等功能则需要另接后端服务，GitHub Pages 本身只负责静态页面。

## 修改人物资料

在 `data/people.json` 编辑对应人物，然后运行 `python3 scripts/sync-people.py`。这是修改数据后的维护步骤，使用页面不需要运行命令。

每位人物包含 `id`、`name`、`era`、`role`、`type`、`tags`、`v`、`desc`、`advice`、`line`、`basis`。`v` 的顺序固定为：决断、共情、开创、洞察、表达、经营、独立、担当；范围 0—100。这些数值表达创作画像中的相对侧重，数值较低不代表人物缺乏能力或品德。

500 份资料分别撰写，未通过模板继承另一人物的文案；所有人物的向量、标签组合、解读和建议均不同。数值是依据作品、经历或传统形象作出的编辑性配置，没有声称是可考证的真实心理参数。部分经典叙事人物的史实身份存在不确定性，解读会注明取意于传统故事。尚未完成逐人史料考证，不应将内容用于历史评价或专业心理判断。

## 匹配方法

每题第一维度计 3 分、第二维度计 2 分。按每个维度在题目中获得分数的最大机会校正，然后将结果归一为总和 1 的八维向量。人物参数也归一为总和 1。计算全部 500 位人物与答案之间的欧氏距离，返回最短距离对应的人物；相似度为 `100 × (1 − distance / √2)`，四舍五入显示。用于选择人物的是未取整距离。

同距时依次比较答案主导维度的绝对差、八维绝对差之和，仍完全相同则按固定 ID 排序。没有姓名哈希、随机推荐、八类预选或替换姓名的过程。同一答案稳定得到同一结果。数据修改后，相同答案可能匹配到不同人物。

## 验证

`python3 scripts/sync-people.py` 校验并生成数据；`node tests/matching.cjs` 检查数据一致性、500 份向量的自身匹配，以及 1 万组答案与独立最近邻计算的结果。抽样触达人数不代表全部可能答案的覆盖率；500 位都参与匹配，不承诺等概率出现。

## 使用与隐私

16 道题选中后自动前进，保留上一题修改、回看答案、重新测试与 PNG 下载。无人物图鉴。答案只尝试保存在当前浏览器，本地文件模式的跨次保存取决于浏览器设置；数据不上传。

## 内容核对参考

部分背景线索的核对资料，不能视为全部 500 位的完整文献依据：

- [教育部关于教材古代科技人物内容的答复](https://www.moe.gov.cn/jyb_xxgk/xxgk_jyta/jyta_jiaocaiju/201712/t20171219_321848.html)：张仲景、祖冲之、李时珍、宋应星、徐光启等人物与代表成果。
- [台北故宫《溪山行旅图》作品介绍](https://artsandculture.google.com/asset/%E6%BA%AA%E5%B1%B1%E8%A1%8C%E6%97%85%E5%9B%BE/2wGYvjhWju99rw?hl=zh-CN)：范宽的作品线索。
- [国家图书馆《史通》资料](https://www.nlc.cn/upload/attachments/2023-12-01/801bba46.pdf)：刘知几的史学理论著作线索。

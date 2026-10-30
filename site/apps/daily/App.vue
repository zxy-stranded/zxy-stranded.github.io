<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Shell from "../../shared/ToolShell.vue";
import { readLocal, writeLocal, shanghaiDate } from "../../shared/storage.js";
import { figures } from "../../shared/history.js";
import {
  dailyQuestion,
  answerDaily,
  validateDaily,
  winStreak,
  hiddenIds,
} from "./core.js";
const KEY = "guanji:daily:v1",
  date = ref(shanghaiDate()),
  saved = ref(validateDaily(readLocal(KEY, null))),
  message = ref(""),
  storageOk = ref(true);
const q = computed(() => dailyQuestion(date.value)),
  entry = computed(
    () => saved.value.days[date.value] || { wrong: [], solved: false },
  ),
  streak = computed(() => winStreak(saved.value.days, date.value)),
  unlocked = computed(() =>
    saved.value.unlocked.map((id) => figures.find((f) => f.id === id)),
  );
function choose(id) {
  try {
    const r = answerDaily(saved.value, date.value, id);
    saved.value = r.state;
    storageOk.value = writeLocal(KEY, r.state);
    message.value = r.correct
      ? r.unlocked
        ? "答对了！连续三天，解锁一张收藏版人物卡。"
        : "答对了，今日人物卡已解锁。"
      : "还差一点。下面有一条提示，可以继续选择。";
  } catch (e) {
    message.value = e.message;
  }
}
function refreshDate() {
  const now = shanghaiDate();
  if (now !== date.value) {
    date.value = now;
    message.value = "北京时间已跨日，新的一题到了。";
  }
}
let timer;
onMounted(() => {
  timer = setInterval(refreshDate, 15000);
  document.addEventListener("visibilitychange", refreshDate);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  document.removeEventListener("visibilitychange", refreshDate);
});
</script>
<template>
  <Shell
    title="一句判词，猜一位故人。"
    kicker="ONE DAY · ONE HISTORICAL STORY"
    intro="每天北京时间0点更新。先听一句描述，再猜猜它属于哪一种人生。"
    ><div class="tool-grid">
      <section class="tool-panel">
        <span class="tool-badge">{{ date }} · 每日一题</span>
        <blockquote class="daily-clue">“{{ q.clue }}”</blockquote>
        <div class="daily-options">
          <button
            v-for="(f, i) in q.options"
            :key="f.id"
            :disabled="entry.solved || entry.wrong.includes(f.id)"
            :class="{
              wrong: entry.wrong.includes(f.id),
              right: entry.solved && f.id === q.figure.id,
            }"
            @click="choose(f.id)"
          >
            <span>{{ "ABCD"[i] }}</span
            >{{ f.name }}<b v-if="entry.solved && f.id === q.figure.id">✓</b>
          </button>
        </div>
        <p class="tool-status" role="status">
          {{
            message ||
            (entry.solved
              ? "今日已答对，明天再来见一位故人。"
              : "每次选择都没有时间限制。")
          }}
        </p>
        <div v-if="entry.wrong.length && !entry.solved" class="tool-note">
          <b>给你一点线索</b>
          <p
            v-for="hint in q.hints.slice(0, Math.min(entry.wrong.length, 2))"
            :key="hint"
          >
            {{ hint }}
          </p>
        </div>
        <div v-if="entry.solved" class="tool-note">
          <h2>{{ q.figure.name }}</h2>
          <p>{{ q.figure.verdict }}</p>
          <p>{{ q.figure.contrast }}</p>
          <a
            class="tool-secondary"
            :href="'../portrait/index.html#/figure/' + q.figure.id"
            >翻开完整档案 ↗</a
          >
        </div>
      </section>
      <aside class="tool-panel">
        <h2>慢慢收藏，慢慢认识。</h2>
        <div class="metric">{{ streak }}<small> 天连续答对</small></div>
        <p class="muted">
          答对后当天计入连续记录；看过提示后答对也计入。每连续完成3天，解锁一张收藏版卡片，最多10张。
        </p>
        <p class="small">收藏版是额外呈现，不影响原有50人图鉴与主测试。</p>
        <div class="collection-cells">
          <span
            v-for="(id, i) in hiddenIds"
            :key="id"
            :class="{ open: saved.unlocked.includes(id) }"
            >{{
              saved.unlocked.includes(id)
                ? figures.find((f) => f.id === id)?.name
                : "未解锁 " + String(i + 1).padStart(2, "0")
            }}</span
          >
        </div>
        <p v-if="!storageOk" class="tool-error">
          浏览器未允许存储，记录暂时只保留在本次页面中。
        </p>
      </aside>
    </div>
    <section v-if="unlocked.length" style="margin-top: 28px">
      <h2>你的收藏版档案</h2>
      <div class="card-grid">
        <article v-for="f in unlocked" :key="f.id" class="mini-card">
          <span class="tool-badge purple">三日收藏 · {{ f.dynasty }}</span>
          <h3>{{ f.name }}</h3>
          <p>{{ f.contrast }}</p>
          <a class="tool-text" :href="'../portrait/index.html#/figure/' + f.id"
            >阅读故事 →</a
          >
        </article>
      </div>
    </section>
    <details class="tool-details">
      <summary>日期与记录规则</summary>
      <p>
        按Asia/Shanghai日期从50人中确定当天题目，同一天所有浏览器得到同一题。以50天为一轮，轮内人物不重复。每种线索保留3个同组干扰项。跨日或回到页面时会刷新。连续记录依据本机日期与本地存储，不跨设备同步，也无法防止手动改时间或清除记录。
      </p>
    </details></Shell
  >
</template>
<style scoped>
.daily-clue {
  font:
    27px/1.9 "Songti SC",
    serif;
  margin: 30px 0;
  color: #6e855f;
}
.daily-options {
  display: grid;
  gap: 11px;
}
.daily-options button {
  background: #f3f6e9;
  border: 1px solid #d2ddc0;
  border-radius: 7px;
  padding: 17px;
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 15px;
  text-align: left;
  font-size: 14px;
}
.daily-options button > span {
  font: 16px Georgia;
  color: #96a783;
}
.daily-options button > b {
  margin-left: auto;
}
.daily-options .wrong {
  background: #f0e9e5;
  border-color: #e1ccc0;
}
.daily-options .right {
  background: #e1ebd1;
  border-color: #9db782;
}
.collection-cells {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  margin-top: 24px;
}
.collection-cells span {
  border: 1px dashed #d3ddc5;
  color: #a1b08e;
  border-radius: 7px;
  min-height: 50px;
  display: grid;
  place-items: center;
  font-size: 10px;
}
.collection-cells span.open {
  background: #eae4f2;
  border: 1px solid #cbbddc;
  color: #8e72aa;
}
@media (max-width: 767px) {
  .daily-clue {
    font-size: 25px;
  }
}
</style>

<script setup>
import { computed, ref, onBeforeUnmount, nextTick } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import { questions, questionIds, groups } from "../engine.js";
import { state, setAnswer, setIndex } from "../store.js";
const router = useRouter(),
  busy = ref(false),
  heading = ref(null);
const ids = computed(() => questionIds(state.session.mode)),
  index = computed(() => state.session.index),
  question = computed(() =>
    questions.find((q) => q.id === ids.value[index.value]),
  );
const selected = computed(() => state.session.answers[question.value.id]),
  answered = computed(
    () => ids.value.filter((id) => state.session.answers[id]).length,
  );
let timer;
function cancel() {
  clearTimeout(timer);
  timer = null;
  busy.value = false;
}
async function focusQuestion() {
  await nextTick();
  heading.value?.focus({ preventScroll: true });
  if (innerWidth < 1024) window.scrollTo({ top: 0, behavior: "instant" });
}
function choose(option) {
  if (busy.value) return;
  setAnswer(question.value.id, option.id);
  busy.value = true;
  timer = setTimeout(() => {
    timer = null;
    busy.value = false;
    if (index.value === ids.value.length - 1) {
      router.push("/loading");
    } else {
      setIndex(index.value + 1);
      focusQuestion();
    }
  }, 240);
}
function previous() {
  cancel();
  if (index.value > 0) {
    setIndex(index.value - 1);
    focusQuestion();
  }
}
function next() {
  cancel();
  if (!selected.value) return;
  if (index.value === ids.value.length - 1) router.push("/loading");
  else {
    setIndex(index.value + 1);
    focusQuestion();
  }
}
onBeforeUnmount(cancel);
onBeforeRouteLeave(cancel);
const facts = [
  [
    "选择之前，不急着定义自己。",
    "历史人物的生活远比标签复杂，现代情境只是理解他们的一面镜。",
  ],
  [
    "一份好奇，可以跨过千年。",
    "沈括把自然观察、技术与文化见闻写进同一部《梦溪笔谈》。",
  ],
  [
    "风格不是一个人的全部。",
    "李清照除了词作，也通过《金石录后序》等文字留下鲜明判断。",
  ],
  [
    "有时候，退开也是一种选择。",
    "张良的经历既包括早年的刺秦，也包括功成后的退身。",
  ],
  ["从分数回到具体的人。", "八个维度描述选择倾向，较高或较低都不是价值排序。"],
];
const fact = computed(() => facts[Math.floor(index.value / 3) % facts.length]);
</script>
<template>
  <div class="quiz-layout">
    <section class="quiz-main">
      <div class="quiz-topline">
        <RouterLink class="back-link" to="/">← 暂存并返回</RouterLink
        ><span
          >{{ state.session.mode === "quick" ? "极速探索" : "完整探索" }}
          <b>{{ String(index + 1).padStart(2, "0") }}</b> /
          {{ ids.length }}</span
        >
      </div>
      <div
        class="progress-track"
        role="progressbar"
        :aria-valuenow="answered"
        :aria-valuemax="ids.length"
        aria-valuemin="0"
        aria-label="已答题数"
      >
        <i :style="{ width: (answered / ids.length) * 100 + '%' }" />
      </div>
      <div class="question-card">
        <div class="question-kicker">
          <span class="serif-index"
            >Question {{ String(index + 1).padStart(2, "0") }}</span
          ><span>{{ question.categoryLabel }}</span>
        </div>
        <h1 ref="heading" tabindex="-1">{{ question.prompt }}</h1>
        <p class="question-hint">
          不必选理想中的自己，选最近的你。选中后自动前进。
        </p>
        <div class="options" role="group" aria-label="答案选项">
          <button
            v-for="o in question.options"
            :key="o.id"
            class="option"
            :class="{ selected: selected === o.id }"
            :disabled="busy"
            :aria-pressed="selected === o.id"
            @click="choose(o)"
          >
            <span class="option-letter">{{ o.id }}</span
            ><span>{{ o.label }}</span
            ><span v-if="selected === o.id" class="option-check">✓</span>
          </button>
        </div>
        <div class="question-actions">
          <button class="text-button" :disabled="index === 0" @click="previous">
            ← 上一题</button
          ><button v-if="selected && !busy" class="text-button" @click="next">
            {{ index === ids.length - 1 ? "查看画像" : "保留答案，继续" }}
            →</button
          ><span v-else class="auto-hint" aria-live="polite">{{
            busy ? "已记下你的选择…" : "凭第一感觉就好"
          }}</span>
        </div>
      </div>
      <p class="saving-note">
        {{
          state.saving
            ? "进度已保存在当前浏览器，可随时回来继续。"
            : "当前浏览器不允许保存；保持此页面打开即可继续答题。"
        }}
      </p>
    </section>
    <aside class="knowledge-column">
      <div class="aside-label">A MOMENT TO REFLECT</div>
      <h2>你的选择，<br />正在勾勒轮廓。</h2>
      <div class="quiet-grid" aria-hidden="true">
        <span
          v-for="(g, i) in groups"
          :key="g.id"
          :class="{ revealed: answered > (i * ids.length) / 10 }"
          >{{
            ["山", "水", "思", "行", "守", "真", "变", "序", "文", "知"][i]
          }}</span
        >
      </div>
      <div class="knowledge-note">
        <span class="tiny-star">✳</span>
        <h3>{{ fact[0] }}</h3>
        <p>{{ fact[1] }}</p>
      </div>
      <p class="aside-bottom">在完成之前，我们先不替你下结论。</p>
    </aside>
  </div>
</template>

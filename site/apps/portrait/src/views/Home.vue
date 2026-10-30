<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { state, start, complete, persist } from "../store.js";
import { figures, groups, questionIds } from "../engine.js";
import Portrait from "../components/Portrait.vue";
import { decodePartner } from "../../../pair/core.js";
const pairQuery = new URLSearchParams(
  location.hash.split("?")[1] || location.search,
);
const pairToken = pairQuery.get("pair");
const pairStart = pairQuery.get("pairStart") === "1";
const pairError = ref("");
let validPair = false;
if (pairToken) {
  try {
    decodePartner(pairToken);
    validPair = true;
  } catch (e) {
    pairError.value = e.message;
  }
}
const router = useRouter(),
  mode = ref(validPair || pairStart ? "full" : "quick");
const hasProgress = computed(
  () => state.session && Object.keys(state.session.answers).length > 0,
);
const progressCount = computed(() =>
  hasProgress.value ? Object.keys(state.session.answers).length : 0,
);
function begin() {
  if (
    hasProgress.value &&
    !complete.value &&
    !confirm("开启新测试会替换本次答题进度。是否继续？")
  )
    return;
  if (pairError.value) return;
  start(validPair || pairStart ? "full" : mode.value);
  if (validPair) state.session.pairInvite = pairToken;
  if (validPair || pairStart) state.session.returnPair = true;
  persist();
  const clean = new URL(location.href);
  clean.searchParams.delete("pair");
  clean.searchParams.delete("pairStart");
  history.replaceState(history.state, "", clean.href);
  router.push("/quiz");
}
function resume() {
  router.push(complete.value ? "/result" : "/quiz");
}
const display = figures.filter((f) =>
  ["sushi", "wanganshi", "simayi", "liqingzhao"].includes(f.id),
);
</script>
<template>
  <section class="home-hero">
    <div class="hero-copy">
      <div class="eyebrow">A LITTLE HISTORY. A LOT OF YOU.</div>
      <span class="edition">全新选择档案 · 第二辑</span>
      <p v-if="validPair || pairStart" class="pair-context">
        双人探索 · 本次使用30题完整版。完成后可回到双人报告。
      </p>
      <p v-if="pairError" class="pair-context" role="alert">
        {{ pairError }} <a href="../pair/index.html">返回双人探索</a>
      </p>
      <h1>穿越千年，<br />遇见另一个<em>自己。</em></h1>
      <p class="hero-description">
        面对相似的处境，你会怎样选择？<br />在 50
        位历史人物的故事里，发现你的性格回响。
      </p>
      <fieldset class="mode-picker">
        <legend class="sr-only">选择测试版本</legend>
        <label :class="{ selected: mode === 'quick' }"
          ><input
            type="radio"
            value="quick"
            v-model="mode"
            :disabled="validPair || pairStart" /><span
            ><b>15 题极速版</b><small>约 2–3 分钟 · 轻松初见</small></span
          ><span class="radio-dot" /></label
        ><label :class="{ selected: mode === 'full' }"
          ><input type="radio" value="full" v-model="mode" /><span
            ><b>30 题完整版</b><small>约 3–5 分钟 · 多面探索</small></span
          ><span class="radio-dot"
        /></label>
      </fieldset>
      <button class="primary hero-start" @click="begin">
        {{ hasProgress ? "开启新的探索" : "开启我的探索"
        }}<span>↗</span></button
      ><button v-if="hasProgress" class="resume-button" @click="resume">
        {{
          complete
            ? "查看上次的人物画像"
            : `继续上次探索 · 已答 ${progressCount}/${questionIds(state.session.mode).length} 题`
        }}
        <span>→</span>
      </button>
      <p class="privacy-line">
        <span>无需登录</span><span>答案仅留在你的浏览器</span
        ><span>无对错之分</span>
      </p>
    </div>
    <div class="hero-collection">
      <div class="collection-orbit" />
      <span class="floating-note">不同选择，同样值得被看见。</span>
      <div class="hero-grid">
        <div
          v-for="(f, i) in display"
          :key="f.id"
          class="mini-portrait-card"
          :class="'mini-' + i"
        >
          <span class="card-number"
            >NO. {{ String(figures.indexOf(f) + 1).padStart(2, "0") }}</span
          ><Portrait :name="f.name" :group="f.group" compact />
          <div class="mini-card-meta">
            <b>{{ f.name }}</b
            ><span>{{ groupForName(f.group) }}</span>
          </div>
        </div>
      </div>
      <span class="collection-stamp">以史<br />观己</span
      ><span class="collection-bottom"
        >50 位人物 / 10 种原型 / 你的独特底色</span
      >
    </div>
  </section>
  <section class="home-steps">
    <article>
      <span>01</span>
      <div>
        <h2>从日常选择出发</h2>
        <p>六类真实情境，没有需要扮演的标准答案。</p>
      </div>
    </article>
    <article>
      <span>02</span>
      <div>
        <h2>知道为什么像</h2>
        <p>八维对比与史料线索，让相似有迹可循。</p>
      </div>
    </article>
    <article>
      <span>03</span>
      <div>
        <h2>也看见不一样</h2>
        <p>你是独立的人，不是任何历史人物的翻版。</p>
      </div>
    </article>
  </section>
  <section class="atlas-teaser">
    <div>
      <div class="eyebrow">MEET THE COLLECTION</div>
      <h2>不急着答题，<br />先与五十种人生打个照面。</h2>
      <p>从开拓者到观察者，每一种选择都有自己的来处。</p>
    </div>
    <RouterLink class="secondary" to="/gallery"
      >翻开人物图鉴 <span>↗</span></RouterLink
    >
  </section>
  <details class="method-note">
    <summary>这份画像如何产生？</summary>
    <p>
      题目覆盖面对强敌、面对不公、用人合作、面对失败、规则态度和人生优先级。每题只对与情境直接相关的维度计分；我们按题目可达的最低与最高分校正，将你的加权选择换算为
      1—10 分的八维向量，与全部 50
      位人物的独立编辑画像比较欧氏距离，选出最近的三位。极速版固定抽取 15
      题，每类至少 2 题。
    </p>
    <p>
      “相似选择题数”按六类情境的倾向标签逐题统计，是编辑推演的吻合数；不代表人物真的回答过这些题。人物参数与判词均为基于作品和传记线索的创作，不是心理量表、道德评分或完整历史评价。
    </p>
  </details>
</template>
<script>
import { groups as allGroups } from "../engine.js";
export default {
  methods: {
    groupForName(id) {
      return allGroups.find((g) => g.id === id)?.name;
    },
  },
};
</script>

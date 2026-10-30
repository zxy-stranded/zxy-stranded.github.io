<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { figureFor, groupFor } from "../engine.js";
import { start, state, complete } from "../store.js";
import Portrait from "../components/Portrait.vue";
const route = useRoute(),
  router = useRouter(),
  figure = computed(() => figureFor(route.params.id));
function begin(mode) {
  if (
    state.session &&
    !complete.value &&
    Object.keys(state.session.answers).length &&
    !confirm("开始新测试将替换你未完成的进度，继续吗？")
  )
    return;
  start(mode);
  router.push("/quiz");
}
</script>
<template>
  <section v-if="figure" class="invite-screen">
    <div class="eyebrow">A LITTLE INVITATION FOR YOU</div>
    <h1>
      你朋友的历史同频者是<br /><em>{{ figure.name }}</em
      >。
    </h1>
    <p>这是一份分享邀请，不是你的测试结果。</p>
    <div class="invite-card">
      <Portrait :name="figure.name" :group="figure.group" /><span
        class="family-badge"
        >{{ groupFor(figure.group).name }}</span
      >
      <blockquote>{{ figure.verdict }}</blockquote>
    </div>
    <h2>如果是你，会怎样选择？</h2>
    <div class="center-actions">
      <button class="primary" @click="begin('quick')">
        15 题，认识我的同频者 <span>↗</span></button
      ><button class="secondary" @click="begin('full')">30 题完整探索</button>
    </div>
    <RouterLink class="back-link" :to="'/figure/' + figure.id"
      >先看看{{ figure.name }}的故事 →</RouterLink
    >
  </section>
</template>

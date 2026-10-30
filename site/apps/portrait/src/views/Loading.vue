<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { result } from "../store.js";
const router = useRouter(),
  progress = ref(0);
let tick, finish;
onMounted(() => {
  const computedResult = result.value;
  if (!computedResult) {
    router.replace("/");
    return;
  }
  tick = setInterval(
    () => (progress.value = Math.min(94, progress.value + 7)),
    100,
  );
  finish = setTimeout(() => {
    progress.value = 100;
    router.replace("/result");
  }, 1600);
});
onBeforeUnmount(() => {
  clearInterval(tick);
  clearTimeout(finish);
});
</script>
<template>
  <section class="loading-screen" aria-live="polite" aria-busy="true">
    <div class="loading-symbol" aria-hidden="true">观</div>
    <div class="eyebrow">FINDING YOUR RESONANCE</div>
    <h1>千年之间，<br />寻找同频的回响。</h1>
    <p>正在比对 50 位历史人物的选择轨迹…</p>
    <div class="loading-track"><i :style="{ width: progress + '%' }" /></div>
    <span>你的每一次选择，都已被认真记下。</span>
  </section>
</template>

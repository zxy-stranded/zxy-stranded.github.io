<script setup>
import { state } from "./store.js";
</script>
<template>
  <a class="skip-link" href="#main">跳到主要内容</a>
  <header class="header">
    <RouterLink class="brand" to="/"
      ><span class="brand-mark">观</span
      ><span>观己<small>PORTRAIT OF YOU</small></span></RouterLink
    >
    <nav aria-label="主导航">
      <a href="../../index.html">返回全部 <span>↗</span></a>
    </nav>
  </header>
  <main id="main" tabindex="-1"><RouterView /></main>
  <footer>
    <span>观己 · 历史人物画像</span
    ><span>相似的只是一些选择，你仍可以写出自己的故事。</span
    ><span>娱乐性自我探索 · 非专业心理测评</span>
  </footer>
  <Transition name="toast"
    ><div v-if="state.toast" class="toast-message" role="status">
      {{ state.toast }}
    </div></Transition
  >
</template>

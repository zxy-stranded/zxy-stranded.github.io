<script setup>
import { useRoute } from "vue-router";
import { state } from "./store.js";
const route = useRoute();
</script>
<template>
  <a class="skip-link" href="#main">跳到主要内容</a>
  <header class="header">
    <RouterLink class="brand" to="/"
      ><span class="brand-mark">观</span
      ><span>观己<small>PORTRAIT OF YOU</small></span></RouterLink
    >
    <nav aria-label="主导航">
      <a href="../../index.html">功能首页 <span>↗</span></a
      ><RouterLink
        to="/"
        :class="{
          active: ['/', '/quiz', '/result', '/loading'].includes(route.path),
        }"
        >人物测试</RouterLink
      ><RouterLink
        to="/gallery"
        :class="{
          active:
            route.path.includes('gallery') || route.path.includes('figure'),
        }"
        >人物图鉴</RouterLink
      >
    </nav>
    <span class="header-note">以历史为镜 · 不以标签为限</span>
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

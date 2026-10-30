<script setup>
defineProps({ title: String, kicker: String, intro: String });
</script>
<template>
  <div class="tool">
    <a class="tool-skip-link" href="#tool-main">跳到主要内容</a>
    <header class="tool-header">
      <a class="tool-brand" href="../../index.html"
        ><span>观</span><b>观己<small>A LITTLE DISCOVERY</small></b></a
      >
      <nav aria-label="页面导航">
        <a href="../../index.html">返回全部 ↗</a>
      </nav>
    </header>
    <main id="tool-main" class="tool-wrap" tabindex="-1">
      <section class="tool-intro">
        <div class="tool-eyebrow">{{ kicker }}</div>
        <h1>{{ title }}</h1>
        <p>{{ intro }}</p>
      </section>
      <slot />
    </main>
    <footer class="tool-footer">
      <span>观己 · 保持好奇</span><span>资料仅在当前浏览器处理，无需登录</span
      ><a href="../../credits.html">资料与依赖</a>
    </footer>
  </div>
</template>

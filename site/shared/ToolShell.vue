<script setup>
defineProps({ title: String, kicker: String, intro: String });
</script>
<template>
  <div class="tool">
    <header class="tool-header">
      <a class="tool-brand" href="../../index.html"
        ><span>观</span><b>观己<small>A LITTLE DISCOVERY</small></b></a
      >
      <nav>
        <a href="../portrait/index.html">人物测试</a
        ><a href="../../index.html">全部探索 ↗</a>
      </nav>
    </header>
    <main class="tool-wrap">
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

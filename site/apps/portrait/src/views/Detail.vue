<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { figureFor, groupFor, figures, dimensions } from "../engine.js";
import Portrait from "../components/Portrait.vue";
import Radar from "../components/Radar.vue";
const route = useRoute(),
  figure = computed(() => figureFor(route.params.id)),
  group = computed(() => groupFor(figure.value.group)),
  siblings = computed(() =>
    figures.filter(
      (f) => f.group === figure.value.group && f.id !== figure.value.id,
    ),
  );
</script>
<template>
  <section v-if="figure" class="detail-page">
    <RouterLink class="back-link" to="/gallery">← 返回人物图鉴</RouterLink>
    <div class="detail-hero">
      <div>
        <div class="eyebrow">HISTORICAL DOSSIER / {{ figure.dynasty }}</div>
        <span class="family-badge">{{ group.name }}</span>
        <h1>{{ figure.name }}</h1>
        <p class="detail-verdict">{{ figure.verdict }}</p>
        <p class="detail-bio">{{ figure.bio }}</p>
      </div>
      <Portrait :name="figure.name" :group="figure.group" />
    </div>
    <div class="detail-columns">
      <div class="panel">
        <div class="panel-kicker">01 / CHOICES</div>
        <h2>关键人生选择</h2>
        <ol class="choices-timeline">
          <li v-for="(choice, i) in figure.choices" :key="choice">
            <span>{{ String(i + 1).padStart(2, "0") }}</span>
            <p>{{ choice }}</p>
          </li>
        </ol>
        <div class="contrast-note">
          <b>另一面，也值得看见</b>
          <p>{{ figure.contrast }}</p>
        </div>
        <p class="source-note">文献线索：{{ figure.source }}</p>
      </div>
      <div class="panel">
        <div class="panel-kicker">02 / FINGERPRINT</div>
        <h2>八维创作画像</h2>
        <Radar :figure="figure.vec" :name="figure.name" />
      </div>
    </div>
    <div class="panel evidence-panel">
      <h2>维度背后的线索</h2>
      <p class="muted">{{ figure.evidenceNote }}</p>
      <div class="evidence-grid">
        <article v-for="(d, i) in dimensions" :key="d.id">
          <div>
            <span>{{ d.name }}</span
            ><b>{{ figure.vec[i] }}<small>/10</small></b>
          </div>
          <p>{{ figure.evidence[i] }}</p>
        </article>
      </div>
    </div>
    <section class="family-section">
      <div class="section-heading">
        <h2>同属{{ group.name }}</h2>
        <span>{{ group.description }}</span>
      </div>
      <div class="family-row">
        <RouterLink v-for="s in siblings" :key="s.id" :to="'/figure/' + s.id"
          ><span>{{ s.name }}</span
          ><small>{{ s.verdict }}</small
          ><b>↗</b></RouterLink
        >
      </div>
    </section>
    <div class="center-actions">
      <RouterLink class="primary" to="/"
        >你会与谁相遇？<span>↗</span></RouterLink
      >
    </div>
    <p class="page-disclaimer">
      历史人物的生活远比参数复杂；这份画像不是完整评价，也不代表认可其全部行为。
    </p>
  </section>
</template>

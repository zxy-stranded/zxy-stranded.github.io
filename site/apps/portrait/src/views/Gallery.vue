<script setup>
import { ref, computed } from "vue";
import { figures, groups, groupFor } from "../engine.js";
const search = ref(""),
  group = ref("all"),
  dynasty = ref("all");
const dynasties = [...new Set(figures.map((f) => f.dynasty))];
const matches = computed(() =>
  figures.filter(
    (f) =>
      (group.value === "all" || f.group === group.value) &&
      (dynasty.value === "all" || f.dynasty === dynasty.value) &&
      (!search.value.trim() ||
        [
          f.name,
          f.bio,
          f.verdict,
          f.name === "唐伯虎" ? "唐寅" : "",
          groupFor(f.group).name,
        ]
          .join("")
          .includes(search.value.trim())),
  ),
);
function clear() {
  search.value = "";
  group.value = "all";
  dynasty.value = "all";
}
</script>
<template>
  <section class="gallery-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow">THE HISTORICAL COLLECTION</div>
        <h1>五十种人生，<em>各有回响。</em></h1>
        <p>不是五十个标准答案，而是五十种看待选择的方式。</p>
      </div>
      <RouterLink class="secondary" to="/">从我的选择开始 ↗</RouterLink>
    </div>
    <div class="gallery-controls">
      <label class="search-box"
        ><span aria-hidden="true">⌕</span
        ><input
          v-model="search"
          type="search"
          placeholder="搜索人物、判词或故事"
          aria-label="搜索人物、判词或故事" /></label
      ><label class="dynasty-select"
        >朝代<select v-model="dynasty">
          <option value="all">全部朝代</option>
          <option v-for="d in dynasties" :key="d">{{ d }}</option>
        </select></label
      >
    </div>
    <div class="group-filters" role="group" aria-label="按原型筛选">
      <button
        :class="{ active: group === 'all' }"
        :aria-pressed="group === 'all'"
        @click="group = 'all'"
      >
        全部 · 50</button
      ><button
        v-for="g in groups"
        :key="g.id"
        :class="{ active: group === g.id }"
        :aria-pressed="group === g.id"
        @click="group = g.id"
      >
        {{ g.name }}
      </button>
    </div>
    <div class="collection-count" role="status">
      找到 {{ matches.length }} 位人物<span
        >相似不是相同，理解不等于认同。</span
      >
    </div>
    <div v-if="matches.length" class="gallery-grid">
      <RouterLink
        v-for="f in matches"
        :key="f.id"
        class="figure-tile"
        :to="'/figure/' + f.id"
        :style="{ '--family-color': groupFor(f.group).color }"
        ><div class="tile-meta">
          <span>{{ f.dynasty }}</span
          ><span>{{ groupFor(f.group).name }}</span>
        </div>
        <div class="tile-title">
          <span class="tile-glyph" aria-hidden="true">{{ f.name[0] }}</span>
          <h2>{{ f.name }}</h2>
          <span>↗</span>
        </div>
        <p>{{ f.verdict }}</p>
        <span class="tile-foot">翻开人物选择档案</span></RouterLink
      >
    </div>
    <div v-else class="empty-state">
      <span>未找到这位同频者</span>
      <p>试试人物名，或放宽朝代与原型筛选。</p>
      <button class="secondary" @click="clear">清除筛选</button>
    </div>
    <p class="page-disclaimer">
      原型用于浏览，匹配时全部人物共同参与比较，不按组预选。画像与判词为编辑性创作。
    </p>
  </section>
</template>

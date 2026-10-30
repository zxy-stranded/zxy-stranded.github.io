<script setup>
import { ref, computed } from "vue";
import Shell from "../../shared/ToolShell.vue";
import { figures, groups } from "../../shared/history.js";
import { allPeople, layoutGraph } from "./core.js";
const graph = layoutGraph(),
  selected = ref(null),
  search = ref(""),
  showRefs = ref(false),
  zoom = ref(1),
  pan = ref({ x: 0, y: 0 }),
  types = ref(["cohort", "partner", "rival", "analogy"]);
const person = computed(() => allPeople.find((p) => p.id === selected.value)),
  relationships = computed(() =>
    graph.edges.filter(
      (e) =>
        (e.source === selected.value || e.target === selected.value) &&
        types.value.includes(e.type),
    ),
  ),
  neighbors = computed(
    () => new Set(relationships.value.flatMap((e) => [e.source, e.target])),
  ),
  visibleNodes = computed(() =>
    graph.nodes.filter(
      (n) => n.group !== "ref" || showRefs.value || neighbors.value.has(n.id),
    ),
  ),
  visibleIds = computed(() => new Set(visibleNodes.value.map((n) => n.id))),
  visibleEdges = computed(() =>
    graph.edges.filter(
      (e) =>
        types.value.includes(e.type) &&
        visibleIds.value.has(e.source) &&
        visibleIds.value.has(e.target),
    ),
  ),
  point = (id) => graph.nodes.find((n) => n.id === id),
  color = (id) => groups.find((g) => g.id === id)?.color || "#ada791",
  typeName = (t) =>
    ({
      cohort: "同类原型",
      partner: "合作/交往",
      rival: "对立/分歧",
      analogy: "跨代参照",
    })[t];
function pick(id) {
  selected.value = id;
  const n = point(id);
  pan.value = { x: 450 - n.x * zoom.value, y: 325 - n.y * zoom.value };
}
function reset() {
  selected.value = null;
  zoom.value = 1;
  pan.value = { x: 0, y: 0 };
  search.value = "";
}
function find() {
  const q = search.value.trim();
  if (!q) return;
  const f =
    allPeople.find((p) => p.name === q) ||
    allPeople.find((p) => p.name.includes(q));
  if (f) pick(f.id);
}
function zoomTo(z) {
  const old = zoom.value;
  zoom.value = Math.max(0.6, Math.min(2.5, z));
  pan.value = {
    x: 450 - ((450 - pan.value.x) / old) * zoom.value,
    y: 325 - ((325 - pan.value.y) / old) * zoom.value,
  };
}
let drag = null;
function down(e) {
  if (e.target.closest(".graph-node")) return;
  drag = { x: e.clientX, y: e.clientY, pan: { ...pan.value } };
  e.currentTarget.setPointerCapture(e.pointerId);
}
function move(e) {
  if (!drag) return;
  const scale = 900 / e.currentTarget.getBoundingClientRect().width;
  pan.value = {
    x: drag.pan.x + (e.clientX - drag.x) * scale,
    y: drag.pan.y + (e.clientY - drag.y) * scale,
  };
}
function edgePath(e) {
  const a = point(e.source),
    b = point(e.target);
  if (e.type === "rival")
    return `M${a.x} ${a.y}Q${(a.x + b.x) / 2 + 18} ${(a.y + b.y) / 2 - 18} ${b.x} ${b.y}`;
  return `M${a.x} ${a.y}L${b.x} ${b.y}`;
}
const matchedNames = computed(() =>
  search.value.trim()
    ? allPeople.filter((p) => p.name.includes(search.value.trim())).slice(0, 8)
    : [],
);
</script>
<template>
  <Shell
    title="把一个人，放回他的关系里。"
    kicker="PEOPLE · CONNECTIONS · DIFFERENCES"
    intro="同类并非相识，对手未必只有仇恨。点一个名字，看看与他相连的合作、分歧与原型参照。"
    ><div class="network-controls">
      <label class="field" style="margin: 0; flex: 1"
        >寻找人物
        <div class="search-inline">
          <input
            v-model="search"
            placeholder="例如：诸葛亮、苏轼"
            @keyup.enter="find"
          /><button class="tool-secondary" @click="find">定位</button>
        </div></label
      ><button class="tool-secondary" @click="reset">显示全部50人</button
      ><label class="check-field"
        ><input v-model="showRefs" type="checkbox" />显示补充关系人物</label
      >
    </div>
    <div v-if="matchedNames.length" class="actions" style="margin: 8px 0 15px">
      <button
        v-for="f in matchedNames"
        :key="f.id"
        class="tool-text"
        @click="pick(f.id)"
      >
        {{ f.name }}
      </button>
    </div>
    <div class="graph-legend">
      <label v-for="t in ['cohort', 'partner', 'rival', 'analogy']" :key="t"
        ><input v-model="types" type="checkbox" :value="t" /><i :class="t" />{{
          typeName(t)
        }}</label
      >
    </div>
    <div class="network-layout">
      <section class="graph-panel">
        <div class="graph-toolbar">
          <span
            >{{ visibleNodes.length }} 位人物 · 可拖动画布，点击名字聚焦</span
          >
          <div>
            <button aria-label="缩小图谱" @click="zoomTo(zoom - 0.2)">−</button
            ><span>{{ Math.round(zoom * 100) }}%</span
            ><button aria-label="放大图谱" @click="zoomTo(zoom + 0.2)">
              ＋
            </button>
          </div>
        </div>
        <svg
          class="network-svg"
          viewBox="0 0 900 650"
          role="group"
          aria-label="历史人物关系图谱，亦可使用搜索和下方关系列表"
          @pointerdown="down"
          @pointermove="move"
          @pointerup="drag = null"
          @pointercancel="drag = null"
        >
          <g :transform="`translate(${pan.x} ${pan.y}) scale(${zoom})`">
            <path
              v-for="e in visibleEdges"
              :key="e.id"
              :d="edgePath(e)"
              class="graph-edge"
              :class="e.type"
              :opacity="
                selected
                  ? neighbors.has(e.source) &&
                    neighbors.has(e.target) &&
                    [e.source, e.target].includes(selected)
                    ? 0.9
                    : 0.07
                  : e.type === 'cohort'
                    ? 0.16
                    : 0.45
              "
            />
            <g
              v-for="n in visibleNodes"
              :key="n.id"
              class="graph-node"
              role="button"
              tabindex="0"
              :aria-label="'查看' + n.name + '的关系'"
              :transform="`translate(${n.x} ${n.y})`"
              :opacity="selected && !neighbors.has(n.id) ? 0.18 : 1"
              @click="pick(n.id)"
              @keydown.enter="pick(n.id)"
              @keydown.space.prevent="pick(n.id)"
            >
              <circle
                :r="selected === n.id ? 22 : 15"
                :fill="color(n.group)"
                :stroke="selected === n.id ? '#3e5f3d' : '#fbfaf5'"
                :stroke-width="selected === n.id ? 3 : 2"
                :stroke-dasharray="n.group === 'ref' ? '3 2' : null"
              />
              <text y="33" text-anchor="middle">{{ n.name }}</text>
            </g>
          </g>
        </svg>
      </section>
      <aside class="tool-panel network-detail">
        <template v-if="person"
          ><span class="tool-badge">{{
            person.reference
              ? "补充关系人物"
              : groups.find((g) => g.id === person.group)?.name
          }}</span>
          <h2 class="result-title">{{ person.name }}</h2>
          <p class="muted">{{ person.verdict }}</p>
          <a
            v-if="!person.reference"
            class="tool-secondary"
            :href="'../portrait/index.html#/figure/' + person.id"
            >完整人物档案 ↗</a
          >
          <p v-else class="small">作为历史关系补充，不参与原有50人主测试。</p>
          <ul class="detail-list relation-list">
            <li v-for="e in relationships" :key="e.id">
              <button
                class="tool-text"
                @click="pick(e.source === selected ? e.target : e.source)"
              >
                {{
                  allPeople.find(
                    (p) =>
                      p.id === (e.source === selected ? e.target : e.source),
                  )?.name
                }}
                ↗ <small>· {{ typeName(e.type) }}</small>
              </button>
              <p>{{ e.note }}</p>
              <small>{{ e.basis }}</small>
            </li>
          </ul></template
        ><template v-else
          ><h2>先点一个名字</h2>
          <p class="muted">
            默认50位主库人物。聚焦后会补上与之直接相连的库外人物，使用虚线描边区分。
          </p>
          <div class="group-dots">
            <span v-for="g in groups" :key="g.id"
              ><i :style="{ background: g.color }" />{{ g.name }}</span
            >
          </div></template
        >
      </aside>
    </div>
    <details class="tool-details">
      <summary>怎样理解这些边？</summary>
      <p>
        同组关系自动生成，可能跨时代，不能理解为真实交往。人工边分别记录合作交往、政治分歧/冲突和明确标注的跨代参照；同一对人物可以同时有合作与分歧。资料是简化索引，不能用一条边概括全部历史关系。
      </p>
    </details></Shell
  >
</template>
<style scoped>
.search-inline button {
  flex-shrink: 0;
  white-space: nowrap;
}
.network-controls {
  display: flex;
  align-items: end;
  gap: 18px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.search-inline {
  display: flex;
  gap: 8px;
  align-items: end;
}
.search-inline input {
  margin-top: 8px;
}
.graph-legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 10px;
  color: #8ba177;
  margin-bottom: 18px;
}
.graph-legend label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
}
.graph-legend i {
  display: block;
  width: 18px;
  border-top: 2px solid #91a575;
}
.graph-legend i.rival {
  border-color: #b68c83;
}
.graph-legend i.partner {
  border-color: #9d8db5;
}
.graph-legend i.analogy {
  border-color: #b5ac8d;
  border-top-style: dashed;
}
.network-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}
.graph-panel {
  background: #f9faf2;
  border: 1px solid #d8e2ca;
  border-radius: 12px;
  overflow: hidden;
}
.graph-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 12px 17px;
  border-bottom: 1px solid #e1e8d8;
  color: #95a783;
  font-size: 9px;
}
.graph-toolbar > div {
  display: flex;
  align-items: center;
  gap: 9px;
}
.graph-toolbar button {
  border: 1px solid #d6e0c8;
  background: #f4f7ea;
  border-radius: 4px;
  min-width: 35px;
  min-height: 35px;
  color: #91aa77;
}
.network-svg {
  display: block;
  width: 100%;
  height: auto;
  min-height: 420px;
  touch-action: none;
  cursor: grab;
}
.graph-edge {
  fill: none;
  stroke: #9eb087;
  stroke-width: 1;
}
.graph-edge.rival {
  stroke: #b48a7c;
  stroke-width: 1.8;
}
.graph-edge.partner {
  stroke: #9c86b5;
  stroke-width: 1.8;
}
.graph-edge.analogy {
  stroke: #aaa085;
  stroke-dasharray: 5 5;
}
.graph-node {
  cursor: pointer;
  outline: none;
}
.graph-node:focus circle {
  stroke: #5b6f92;
  stroke-width: 4;
}
.graph-node text {
  font: 12px sans-serif;
  fill: #71895e;
  paint-order: stroke;
  stroke: #f9faf2;
  stroke-width: 3px;
}
.network-detail {
  position: sticky;
  top: 20px;
  padding: 22px;
}
.relation-list {
  max-height: 480px;
  overflow: auto;
  margin-top: 20px;
}
.relation-list p {
  margin: 0;
  font-size: 11px;
}
.relation-list small {
  font-size: 9px;
  color: #a3b28f;
  line-height: 1.8;
}
.relation-list .tool-text {
  padding: 0;
  min-height: 35px;
  font-size: 13px;
  color: #779b5a;
}
.group-dots {
  display: grid;
  gap: 14px;
  margin-top: 25px;
}
.group-dots span {
  font-size: 11px;
  color: #91a87b;
  display: flex;
  align-items: center;
  gap: 10px;
}
.group-dots i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
@media (max-width: 900px) {
  .network-layout {
    grid-template-columns: 1fr;
  }
  .network-detail {
    position: static;
  }
  .relation-list {
    max-height: 340px;
  }
  .group-dots {
    grid-template-columns: 1fr 1fr;
  }
  .network-controls .field {
    min-width: 100%;
  }
  .network-svg {
    min-height: 360px;
  }
  .graph-toolbar {
    font-size: 8px;
    padding: 10px;
  }
  .graph-legend {
    gap: 10px;
  }
}
</style>

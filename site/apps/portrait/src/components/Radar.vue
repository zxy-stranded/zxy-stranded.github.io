<script setup>
import { computed } from "vue";
import { dimensions } from "../engine.js";
const props = defineProps({
  user: Array,
  figure: { type: Array, required: true },
  name: { type: String, default: "人物" },
});
const point = (i, v, r = 112) => {
  const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
  return [160 + (Math.cos(a) * r * v) / 10, 151 + (Math.sin(a) * r * v) / 10];
};
const polygon = (values) =>
  values.map((v, i) => point(i, v).join(",")).join(" ");
const rows = computed(() =>
  dimensions.map((d, i) => ({
    ...d,
    user: props.user?.[i],
    figure: props.figure[i],
  })),
);
</script>
<template>
  <div class="radar-wrap">
    <svg
      viewBox="0 0 320 310"
      role="img"
      :aria-label="'八维对比：' + name + '画像' + (user ? '与本次选择' : '')"
    >
      <g v-for="level in [2, 4, 6, 8, 10]" :key="level">
        <polygon
          :points="polygon(Array(8).fill(level))"
          fill="none"
          stroke="#e0e2d7"
        />
      </g>
      <path
        v-for="i in 8"
        :key="i"
        :d="`M160 151L${point(i - 1, 10).join(' ')}`"
        stroke="#e0e2d7"
      />
      <polygon
        :points="polygon(figure)"
        fill="#9985bb"
        fill-opacity=".17"
        stroke="#9985bb"
        stroke-width="2"
      />
      <polygon
        v-if="user"
        :points="polygon(user)"
        fill="#688566"
        fill-opacity=".17"
        stroke="#4d7659"
        stroke-width="2"
      />
      <text
        v-for="(d, i) in dimensions"
        :key="d.id"
        :x="point(i, 10, 139)[0]"
        :y="point(i, 10, 139)[1] + 4"
        text-anchor="middle"
        font-size="11"
        fill="#75826f"
      >
        {{ d.name }}
      </text>
    </svg>
    <div class="legend">
      <span v-if="user"><i class="green-dot" />你的选择</span
      ><span><i class="purple-dot" />{{ name }}画像</span>
    </div>
    <details class="score-table">
      <summary>查看准确数值与维度含义</summary>
      <div v-for="row in rows" :key="row.id">
        <span
          >{{ row.name }}<small>{{ row.low }} ↔ {{ row.high }}</small></span
        ><b v-if="user">{{ row.user.toFixed(1) }}</b
        ><b>{{ row.figure }}</b>
      </div>
      <p>范围 1—10；呈现选择倾向，不是能力或道德评分。</p>
    </details>
  </div>
</template>

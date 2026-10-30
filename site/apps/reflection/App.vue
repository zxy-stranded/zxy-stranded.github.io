<script setup>
import { ref, computed } from "vue";
import Shell from "../../shared/ToolShell.vue";
import { shanghaiTime } from "../../shared/storage.js";
import { coinThrow, coinsResult, timeResult } from "./core.js";
const mode = ref("coins"),
  question = ref(""),
  time = ref(shanghaiTime()),
  totals = ref([]),
  last = ref(null),
  result = ref(null),
  error = ref(""),
  busy = ref(false);
function reset() {
  totals.value = [];
  last.value = null;
  result.value = null;
  error.value = "";
}
function changeMode(value) {
  mode.value = value;
  reset();
}
function toss() {
  if (busy.value || totals.value.length === 6) return;
  busy.value = true;
  try {
    last.value = coinThrow();
    totals.value.push(last.value.total);
    if (totals.value.length === 6) result.value = coinsResult(totals.value);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
function fromTime() {
  try {
    result.value = timeResult(time.value);
    error.value = "";
  } catch (e) {
    error.value = e.message;
    result.value = null;
  }
}
const visibleLines = computed(() =>
  result.value ? result.value.lines : totals.value.map((n) => n % 2),
);
</script>
<template>
  <Shell
    title="借一种古老的结构，换一个思考角度。"
    kicker="SIX LINES · A MOMENT TO REFLECT"
    intro="六十四种图景，不替你给出结论。把一个困惑放在这里，用三个问题重新看待它。"
    ><div class="tool-grid">
      <section class="tool-panel">
        <div class="tool-tabs" role="group" aria-label="选择方式">
          <button
            :class="{ active: mode === 'coins' }"
            @click="changeMode('coins')"
          >
            三钱六掷</button
          ><button
            :class="{ active: mode === 'time' }"
            @click="changeMode('time')"
          >
            按时间取象
          </button>
        </div>
        <label class="field"
          >想思考的问题（可选）<textarea
            v-model="question"
            maxlength="160"
            placeholder="例如：如何把眼前的计划拆成更稳妥的一步？"
          /><small>仅用于提醒自己，不参与规则计算，也不会上传。</small></label
        ><template v-if="mode === 'coins'"
          ><h2>从最下面的一爻开始。</h2>
          <p class="muted">
            每次投出三枚铜钱，依次记录六次。正反两面记为2、3；6与9对应变化的爻。
          </p>
          <div class="coins-stage" aria-live="polite">
            <span
              v-for="(n, i) in last?.coins || [2, 3, 2]"
              :key="i"
              class="coin"
              >{{ n === 2 ? "文" : "背" }}</span
            >
          </div>
          <button
            class="tool-button"
            :disabled="busy || totals.length === 6"
            @click="toss"
          >
            {{
              totals.length === 6
                ? "六次已完成"
                : `投第 ${totals.length + 1} 次 / 共6次`
            }}</button
          ><button class="tool-text" @click="reset">重新开始</button>
          <p class="small">
            {{
              totals.length
                ? `从初爻到上爻：${totals.join(" · ")}`
                : "随机来自浏览器，每次都是独立的三枚投掷。"
            }}
          </p></template
        ><template v-else
          ><label class="field"
            >北京时间（UTC+8）<input
              v-model="time"
              type="datetime-local"
              min="1901-01-01T00:00"
              max="2099-12-31T23:59"
            /><small
              >可填写当下或一个想回顾的时刻；同一农历年月日与时辰，结果相同。</small
            ></label
          >
          <div class="actions">
            <button class="tool-button" @click="fromTime">
              生成本次反思图景 →</button
            ><button class="tool-text" @click="time = shanghaiTime()">
              使用北京时间现在
            </button>
          </div></template
        >
        <p v-if="error" class="tool-error" role="alert">{{ error }}</p>
        <div class="tool-note">
          仅供传统文化视角的自我反思参考，不构成任何决策依据。无需输入真实身份，不设置付费解锁。
        </div>
      </section>
      <section class="tool-panel">
        <div v-if="!result && !visibleLines.length" class="empty">
          <span class="serif" style="font-size: 30px"
            >留一刻空白，再看看问题。</span
          >
          <p class="small">六次完成后，图景与反思提示会出现在这里。</p>
        </div>
        <template v-else
          ><div
            class="hex-lines"
            role="img"
            :aria-label="'从下往上记录的' + visibleLines.length + '条阴阳线'"
          >
            <div
              v-for="(line, i) in [...visibleLines].reverse()"
              :key="i"
              class="hex-line"
              :class="{ yin: line === 0 }"
            >
              <i /><i /><small
                >{{ visibleLines.length - i
                }}{{
                  result?.moving.includes(visibleLines.length - i)
                    ? " · 变"
                    : ""
                }}</small
              >
            </div>
          </div>
          <template v-if="result"
            ><span class="tool-badge"
              >第 {{ result.main.number }} 卦 · {{ result.main.upper }}上{{
                result.main.lower
              }}下</span
            >
            <h2 class="result-title">{{ result.main.image }}</h2>
            <p class="reflection-tip">{{ result.main.tip }}</p>
            <p v-if="question" class="small">你正在思考：{{ question }}</p>
            <ol class="reflection-questions">
              <li v-for="q in result.main.questions" :key="q">{{ q }}</li>
            </ol>
            <div class="tool-note">
              <b>一个可以尝试的小行动</b>
              <p>{{ result.main.action }}</p>
            </div>
            <details class="tool-details">
              <summary>查看变化后的图景与本次规则</summary>
              <p>
                变化位置：{{
                  result.moving.length ? result.moving.join("、") + "爻" : "无"
                }}。变化后的图景为「{{
                  result.changed.image
                }}」，用于另一个观察角度，不是后续会发生的事情。
              </p>
              <p>{{ result.changed.tip }}</p>
              <p>{{ result.method }}</p>
              <p v-if="result.calculation">
                本次参数：{{ result.calculation.lunar }}；年支序{{
                  result.calculation.year
                }}、月{{ result.calculation.month }}、日{{
                  result.calculation.day
                }}、时支序{{ result.calculation.hourOrder }}。
              </p>
            </details></template
          ></template
        >
      </section>
    </div>
    <p class="tool-privacy">
      问题与时间只在页面内计算，不持久保存。64份现代解读为预写原创文案；图形与卦序参照通行《周易》体系，不作专业或个人结果判断。
    </p></Shell
  >
</template>
<style scoped>
.coins-stage {
  display: flex;
  gap: 18px;
  justify-content: center;
  padding: 28px 0;
}
.coin {
  width: 65px;
  height: 65px;
  border: 3px solid #c5b68c;
  outline: 1px solid #d4c7a4;
  outline-offset: 5px;
  border-radius: 50%;
  background: #e7ddc1;
  display: grid;
  place-items: center;
  color: #978455;
  font: 26px serif;
}
.hex-lines {
  width: 170px;
  min-height: 120px;
  margin: 20px auto 35px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hex-line {
  position: relative;
  display: flex;
  gap: 0;
}
.hex-line i {
  height: 10px;
  width: 50%;
  background: #627c56;
}
.hex-line.yin {
  gap: 20px;
}
.hex-line small {
  position: absolute;
  right: -48px;
  font-size: 9px;
  color: #a68cba;
  white-space: nowrap;
}
.reflection-tip {
  font: 25px/1.8 serif;
  color: #8c76a3;
}
.reflection-questions {
  padding-left: 24px;
  color: #7c916b;
}
.reflection-questions li {
  padding: 10px 0;
  font-size: 14px;
  line-height: 1.9;
}
@media (max-width: 767px) {
  .coin {
    width: 57px;
    height: 57px;
  }
  .reflection-tip {
    font-size: 23px;
  }
}
</style>

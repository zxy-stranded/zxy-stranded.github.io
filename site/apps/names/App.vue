<script setup>
import { ref, reactive, computed } from "vue";
import Shell from "../../shared/ToolShell.vue";
import { readLocal, writeLocal } from "../../shared/storage.js";
import { generateNames, characters, poems, surnames } from "./core.js";
const form = reactive({
    surname: "",
    pronunciation: "",
    mother: "",
    gender: "any",
    birth: "",
    style: "ancient",
    includeMother: false,
  }),
  report = ref(null),
  error = ref(""),
  batch = ref(0),
  busy = ref(false),
  lastInput = ref(""),
  duration = ref(0),
  notice = ref(""),
  showFavorites = ref(false);
const saved = readLocal("guanji:names:v1:favorites", []),
  favorites = ref(
    Array.isArray(saved)
      ? saved
          .filter((n) => n && typeof n.name === "string" && n.name.length <= 5)
          .slice(0, 80)
      : [],
  );
const dirty = computed(
    () => lastInput.value && lastInput.value !== JSON.stringify(form),
  ),
  display = computed(() =>
    showFavorites.value ? favorites.value : report.value?.names || [],
  );
function submit(reset = true) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    if (reset || dirty.value) batch.value = 0;
    else batch.value++;
    const start = performance.now();
    report.value = generateNames({ ...form }, batch.value);
    duration.value = performance.now() - start;
    lastInput.value = JSON.stringify(form);
    showFavorites.value = false;
    if (!report.value.names.length)
      error.value = "这个组合暂时没有足够候选，可取消融入母姓或调整风格。";
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
function toggleFavorite(n) {
  const i = favorites.value.findIndex((x) => x.name === n.name);
  if (i >= 0) favorites.value.splice(i, 1);
  else {
    if (favorites.value.length >= 80) {
      notice.value = "最多保留80个收藏，请先整理。";
      return;
    }
    favorites.value.push(n);
  }
  notice.value = writeLocal("guanji:names:v1:favorites", favorites.value)
    ? "收藏已保存在当前浏览器。"
    : "浏览器未允许保存，收藏暂留在本次页面。";
}
function favorited(n) {
  return favorites.value.some((x) => x.name === n.name);
}
</script>
<template>
  <Shell
    title="为一个新的名字，留一点诗意。"
    kicker="A NAME · A MEANING · A LITTLE POETRY"
    intro="从字义、声调与真实诗句出发，慢慢挑选你们喜欢的名字。没有唯一答案，也不以名字决定人生。"
    ><div class="tool-grid naming-layout">
      <form class="tool-panel name-form" @submit.prevent="submit(true)">
        <h2>先说说你们的期待</h2>
        <div class="field-row">
          <label class="field"
            >父亲姓氏 / 使用的姓氏<input
              v-model.trim="form.surname"
              placeholder="例如：林、欧阳"
              maxlength="2"
              required
              autocomplete="off" /></label
          ><label class="field"
            >母亲姓氏（选填）<input
              v-model.trim="form.mother"
              placeholder="例如：陈"
              maxlength="2"
              autocomplete="off"
          /></label>
        </div>
        <details class="tool-details" style="margin-bottom: 16px">
          <summary>生僻姓或家族特殊读音</summary>
          <label class="field" style="margin-top: 12px"
            >姓氏读音（选填）
            <input
              v-model.trim="form.pronunciation"
              placeholder="如qi2；复姓用ou1 yang2"
              autocomplete="off"
            />
            <small
              >填写每个字的拼音和1—4声数字，复姓用空格分隔；留空时使用已标注的姓氏读音。</small
            >
          </label>
        </details>
        <label class="check-field"
          ><input
            v-model="form.includeMother"
            type="checkbox"
          />在名字中融入母姓的一个字</label
        >
        <div class="field-row" style="margin-top: 18px">
          <label class="field"
            >用字偏好<select v-model="form.gender">
              <option value="any">不限定</option>
              <option value="male">偏向男孩用字</option>
              <option value="female">偏向女孩用字</option>
            </select></label
          ><label class="field"
            >名字风格<select v-model="form.style">
              <option value="ancient">古风雅意</option>
              <option value="modern">现代清朗</option>
              <option value="neutral">中性简洁</option>
              <option value="shijing">取字自《诗经》</option>
              <option value="chuci">取字自《楚辞》</option>
            </select></label
          >
        </div>
        <label class="field"
          >出生日期与时间（选填，UTC+8）<input
            v-model="form.birth"
            type="datetime-local"
            min="1901-01-01T00:00"
            max="2099-12-31T23:59"
          /><small
            >不确定时辰可以留空；没有时间时不生成历法统计。仅支持1901—2099年，不校正真太阳时。</small
          ></label
        ><button class="tool-button" style="width: 100%" :disabled="busy">
          {{ busy ? "正在整理…" : "生成10个候选名 →" }}
        </button>
        <p v-if="error" class="tool-error" role="alert">{{ error }}</p>
        <p v-if="dirty" class="small">选项已改变，下一次生成将使用新条件。</p>
        <details class="tool-details">
          <summary>字库与文化标注说明</summary>
          <p>
            {{ characters.length }}个精选字、{{ poems.length }}条诗句、{{
              surnames.length
            }}个姓氏。用字五行是本字库的民俗归类，并无统一字典标准；字义为起名语境的简释。性别仅为偏好筛选，不是字的固有属性。
          </p>
          <p>
            诗句有实际篇名与作者；取字可能并不连续，均标注“同句取字”，不是伪造古籍里存在完整姓名。普通组合明确不附会出处。涉及多音字、生僻姓与方言，请家人核对。
          </p>
        </details>
      </form>
      <section>
        <div class="naming-topbar">
          <span class="section-label">{{
            showFavorites ? "YOUR SHORTLIST" : "NAME EXPLORATIONS"
          }}</span
          ><button class="tool-text" @click="showFavorites = !showFavorites">
            {{ showFavorites ? "返回候选" : "我的收藏" }} ·
            {{ favorites.length }}
          </button>
        </div>
        <div
          v-if="!report && !showFavorites"
          class="tool-panel empty name-empty"
        >
          <span class="serif">一个名字，<br />可以从一份喜欢开始。</span>
          <p class="small">
            填写姓氏，试着生成第一批。<br />出生时间不会持久保存或上传。
          </p>
        </div>
        <template v-if="report && !showFavorites"
          ><div v-if="report.analysis" class="tool-panel culture-analysis">
            <span class="tool-badge">干支表层计数 · 文化参考</span>
            <p class="small">{{ report.analysis.pillars.join(" · ") }}</p>
            <div class="element-counts">
              <span v-for="(n, k) in report.analysis.counts" :key="k"
                >{{ k }} <b>{{ n }}</b></span
              >
            </div>
            <p class="small">
              本次计数较少的方向：{{
                report.analysis.less.join("、")
              }}。不代表个人需要补充什么，也不以此判断名字能带来改变。
            </p>
            <details class="tool-details">
              <summary>查看统计口径</summary>
              <p>{{ report.analysis.note }}</p>
            </details>
          </div>
          <div class="batch-controls">
            <span class="small"
              >共{{ report.total }}个候选 · 第{{
                report.batch + 1
              }}批<br />规则筛选耗时 {{ duration.toFixed(1) }}ms</span
            ><button
              class="tool-secondary"
              :disabled="busy || report.total <= 10"
              @click="submit(false)"
            >
              换一批 ↻
            </button>
          </div>
          <p v-if="report.surname.unlisted" class="small">
            该姓氏读音由你填写，请与家人确认。
          </p></template
        >
        <div v-if="display.length" class="name-cards">
          <article
            v-for="n in display"
            :key="n.name"
            class="tool-panel name-card"
          >
            <div class="name-title">
              <h2>{{ n.name }}</h2>
              <button
                class="favorite-button"
                :aria-label="(favorited(n) ? '取消收藏' : '收藏') + n.name"
                :aria-pressed="favorited(n)"
                @click="toggleFavorite(n)"
              >
                {{ favorited(n) ? "♥" : "♡" }}
              </button>
            </div>
            <p class="name-pinyin">{{ n.pinyin }}</p>
            <p class="name-meaning">
              <span v-for="c in n.chars" :key="c.char"
                ><b>{{ c.char }}</b> · {{ c.meaning
                }}<small>{{ c.element }} / {{ c.tone }}声</small></span
              >
            </p>
            <div v-if="n.source" class="poem-source">
              <blockquote>“{{ n.source.quote }}”</blockquote>
              <small
                >{{ n.source.author }}《{{ n.source.title }}》·
                {{ n.source.collection }} · 同句取字</small
              >
            </div>
            <p v-else class="small">字义组合，未附会诗词出处。</p>
            <p class="small">{{ n.sound }}</p>
          </article>
        </div>
        <div v-else-if="showFavorites" class="empty">
          还没有收藏，先从一份喜欢开始。
        </div>
        <p class="tool-status" role="status">{{ notice }}</p>
      </section>
    </div>
    <div class="tool-note">
      起名建议仅供文化娱乐参考，请结合家庭意愿自主决定。谐音仅做普通话有限规则筛选，不覆盖全部方言、语境与多音读法；建议连姓试读，并确认户籍登记用字要求。
    </div></Shell
  >
</template>
<style scoped>
.naming-layout {
  grid-template-columns: 390px 1fr;
}
.name-form {
  position: sticky;
  top: 20px;
}
.naming-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}
.name-empty {
  padding: 80px 20px;
}
.name-empty > .serif {
  font-size: 31px;
  line-height: 1.8;
  color: #859a75;
}
.name-empty p {
  margin-top: 25px;
}
.culture-analysis {
  padding: 22px;
}
.element-counts {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.element-counts span {
  padding: 8px 12px;
  background: #ecf0e1;
  border: 1px solid #dce5ce;
  border-radius: 6px;
  font-size: 12px;
  color: #8ba375;
}
.element-counts b {
  margin-left: 5px;
  font-weight: 500;
}
.batch-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
}
.name-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.name-card {
  padding: 23px;
}
.name-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.name-title h2 {
  font-size: 31px;
  margin: 0;
}
.favorite-button {
  background: none;
  border: 0;
  min-height: 44px;
  min-width: 36px;
  color: #a18ab7;
  font-size: 25px;
}
.name-pinyin {
  color: #9baa88;
  font-size: 11px;
  margin: 10px 0 16px;
}
.name-meaning {
  display: flex;
  gap: 17px;
  color: #80996c;
  font-size: 12px;
}
.name-meaning span {
  flex: 1;
}
.name-meaning b {
  font-weight: 500;
  font-size: 17px;
}
.name-meaning small {
  display: block;
  font-size: 9px;
  margin-top: 6px;
  color: #a1b08e;
}
.poem-source {
  padding-top: 16px;
  border-top: 1px solid #e1e8d8;
  color: #9982b0;
}
.poem-source blockquote {
  font: 17px/1.8 serif;
  margin: 0 0 10px;
}
.poem-source small {
  font-size: 9px;
  line-height: 1.9;
  display: block;
}
.name-card > p:last-child {
  margin-bottom: 0;
  margin-top: 17px;
  font-size: 10px;
}
@media (max-width: 1050px) {
  .naming-layout {
    grid-template-columns: 330px 1fr;
  }
  .name-cards {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 767px) {
  .naming-layout {
    grid-template-columns: 1fr;
  }
  .name-form {
    position: static;
  }
  .name-empty {
    padding: 55px 20px;
  }
  .name-cards {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .name-card {
    padding: 18px 14px;
  }
  .name-title h2 {
    font-size: 27px;
  }
  .name-meaning {
    gap: 12px;
    font-size: 13px;
  }
  .poem-source blockquote {
    font-size: 16px;
  }
  .name-meaning small {
    font-size: 11px;
  }
}
@media (max-width: 540px) {
  .poem-source small,
  .name-card > p:last-child {
    font-size: 12px;
  }
  .name-cards {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup>
import { computed, ref, nextTick, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { result, state, notify, setIndex } from "../store.js";
import {
  groupFor,
  figures,
  personalityTags,
  invitationUrl,
} from "../engine.js";
import Portrait from "../components/Portrait.vue";
import Radar from "../components/Radar.vue";
import { createShareCard } from "../share.js";
const router = useRouter(),
  data = computed(() => result.value),
  figure = computed(() => data.value.primary.figure),
  group = computed(() => groupFor(figure.value.group)),
  family = computed(() =>
    figures.filter(
      (f) => f.group === figure.value.group && f.id !== figure.value.id,
    ),
  ),
  sharing = ref(false),
  image = ref(""),
  shareDialog = ref(null),
  manualLink = ref("");
function restart() {
  router.push("/");
}
function review() {
  setIndex(0);
  router.push("/quiz");
}
async function generate() {
  if (sharing.value) return;
  sharing.value = true;
  try {
    const card = await createShareCard(data.value, location.href);
    image.value = card.image;
    await nextTick();
    if (typeof shareDialog.value.showModal === "function") {
      shareDialog.value.showModal();
    } else {
      shareDialog.value.classList.add("fallback-open");
      shareDialog.value.setAttribute("open", "");
      shareDialog.value.querySelector("button")?.focus();
    }
  } catch (e) {
    notify(e.message || "生成失败，请稍后重试");
  } finally {
    sharing.value = false;
  }
}
async function copy() {
  const link = invitationUrl(figure.value.id, location.href);
  try {
    await navigator.clipboard.writeText(link);
    notify("邀请链接已复制");
  } catch {
    manualLink.value = link;
    notify("请从下方文本框中选择并复制链接");
  }
}
function close() {
  if (!shareDialog.value) return;
  if (typeof shareDialog.value.close === "function") shareDialog.value.close();
  shareDialog.value.removeAttribute("open");
  shareDialog.value.classList.remove("fallback-open");
}
onBeforeUnmount(close);
</script>
<template>
  <section v-if="data" class="result-page">
    <div class="result-heading">
      <div class="eyebrow">YOUR CHOICES HAVE A HISTORY</div>
      <span
        >{{ data.total }} 道情境 ·
        {{ data.mode === "quick" ? "极速探索" : "完整探索" }}</span
      >
    </div>
    <div class="result-hero">
      <article class="result-main">
        <div class="result-persona">
          <span v-for="tag in personalityTags(data.vec)" :key="tag">{{
            tag
          }}</span>
        </div>
        <p class="result-pretitle">你的历史同频者</p>
        <div class="name-and-portrait">
          <div>
            <span class="family-badge">{{ group.name }}</span>
            <h1>{{ figure.name }}</h1>
            <span class="figure-era">{{ figure.dynasty }} · 独立创作画像</span>
          </div>
          <Portrait :name="figure.name" :group="figure.group" compact />
        </div>
        <blockquote class="verdict">{{ figure.verdict }}</blockquote>
        <div class="agreement-summary">
          <strong
            >{{ data.count }}<small> / {{ data.total }}</small></strong
          >
          <div>
            <b>道情境的选择方向与你吻合</b
            ><span>基于人物倾向标签的编辑推演</span>
          </div>
        </div>
        <p class="agreement-disclaimer">
          这是你与{{ figure.name }}画像的相似，不是他本人对现代题目的作答。
        </p>
      </article>
      <aside class="result-sidebar">
        <div class="aside-label">A MIRROR, NOT A LABEL</div>
        <h2>相似的不是命运，<br />是一些选择的方向。</h2>
        <p>{{ figure.bio }}</p>
        <div class="result-similarity">
          <strong>{{ data.primary.similarity }}<small>%</small></strong>
          <div>八维接近程度<span>由实际向量距离计算，非概率</span></div>
        </div>
        <button class="secondary" @click="generate" :disabled="sharing">
          {{ sharing ? "正在绘制画像…" : "保存我的分享图" }}
          <span>↓</span></button
        ><button class="text-button" @click="copy">复制邀请链接 ↗</button
        ><label v-if="manualLink" class="manual-copy"
          >长按选择链接<input
            :value="manualLink"
            readonly
            @focus="$event.target.select()"
        /></label>
      </aside>
    </div>
    <section class="result-analysis">
      <div class="section-heading">
        <h2><span>01</span> 为什么像这个人？</h2>
        <span>你与人物画像的八维对比</span>
      </div>
      <div class="analysis-grid">
        <div class="panel radar-panel">
          <Radar :user="data.vec" :figure="figure.vec" :name="figure.name" />
        </div>
        <div class="matching-reasons">
          <article v-for="d in data.closest" :key="d.id">
            <div class="reason-top">
              <span>{{ d.name }}</span
              ><small>你 {{ d.user.toFixed(1) }} / 画像 {{ d.figure }}</small>
            </div>
            <p>{{ d.evidence }}</p>
            <small class="reason-context"
              >此维度差 {{ d.gap.toFixed(1) }} 分 · 1—10 编辑尺度</small
            >
          </article>
          <article class="unlike">
            <div class="reason-top">
              <span>最不一样：{{ data.contrast.name }}</span
              ><small
                >你 {{ data.contrast.user.toFixed(1) }} / 他
                {{ data.contrast.figure }}</small
              >
            </div>
            <p>
              这一面，你比{{ figure.name }}的画像更偏向「{{
                data.contrast.user > data.contrast.figure
                  ? data.contrast.high
                  : data.contrast.low
              }}」。历史同频者也不必每一步都同频。
            </p>
          </article>
        </div>
      </div>
      <p class="source-note">
        人物线索：{{
          figure.source
        }}。八维分值与上述对应关系为编辑性解读，不是史料中的心理测量。
      </p>
    </section>
    <details class="answer-audit">
      <summary>
        展开核对：{{ data.count }} 道吻合，{{ data.total - data.count }} 道不同
      </summary>
      <p>
        逐题比对所选方向与人物在该类情境中的倾向标签；不由百分比换算，不人为凑高吻合数。
      </p>
      <article v-for="(d, i) in data.details" :key="d.id">
        <span class="audit-mark" :class="{ aligned: d.aligned }">{{
          d.aligned ? "吻合" : "不同"
        }}</span>
        <div>
          <h3>{{ i + 1 }}. {{ d.prompt }}</h3>
          <p>你的选择：{{ d.chosen }}</p>
          <p v-if="!d.aligned">画像倾向：{{ d.expected.join(" / ") }}</p>
        </div>
      </article>
    </details>
    <section class="story-section">
      <div class="section-heading">
        <h2><span>02</span> 人物也有另一面</h2>
        <RouterLink :to="'/figure/' + figure.id">完整档案 ↗</RouterLink>
      </div>
      <div class="story-grid">
        <div class="panel">
          <span class="panel-kicker">THE TURNING POINTS</span>
          <h3>那些塑造轮廓的选择</h3>
          <ol class="choices-timeline">
            <li v-for="(choice, i) in figure.choices" :key="choice">
              <span>{{ String(i + 1).padStart(2, "0") }}</span>
              <p>{{ choice }}</p>
            </li>
          </ol>
        </div>
        <div class="contrast-note">
          <span class="tiny-star">✳</span>
          <h3>不只是一张标签</h3>
          <p>{{ figure.contrast }}</p>
          <RouterLink :to="'/figure/' + figure.id"
            >走近{{ figure.name }}的故事 →</RouterLink
          >
        </div>
      </div>
    </section>
    <section class="family-section">
      <div class="section-heading">
        <h2><span>03</span> 你属于{{ group.name }}家族</h2>
        <RouterLink to="/gallery">全部人物 ↗</RouterLink>
      </div>
      <p class="muted">
        {{ group.description }}。同组便于参照，但并不代表他们具有相同的性格。
      </p>
      <div class="family-row">
        <RouterLink v-for="s in family" :key="s.id" :to="'/figure/' + s.id"
          ><span>{{ s.name }}</span
          ><small>{{ s.verdict }}</small
          ><b>↗</b></RouterLink
        >
      </div>
    </section>
    <section class="secondary-matches">
      <div class="section-heading">
        <h2><span>04</span> 还有两位与你接近</h2>
        <span>全部 50 人共同参与距离排序</span>
      </div>
      <div class="secondary-row">
        <RouterLink
          v-for="(m, i) in data.secondary"
          :key="m.figure.id"
          :to="'/figure/' + m.figure.id"
          ><span class="secondary-rank">0{{ i + 2 }}</span>
          <div>
            <h3>{{ m.figure.name }}</h3>
            <p>{{ m.figure.verdict }}</p>
          </div>
          <span class="secondary-percentage"
            >{{ m.similarity }}<small>%</small></span
          ></RouterLink
        >
      </div>
    </section>
    <div class="pair-entry">
      <h2>
        {{
          state.session.pairInvite
            ? "两个人的报告，也准备好了。"
            : "邀请一个人，看看你们如何相遇。"
        }}
      </h2>
      <p>仅分享八维摘要；同样30题，生成一份相近与不同的对照。</p>
      <a
        class="secondary"
        :href="
          state.session.pairInvite
            ? '../pair/index.html#a=' +
              encodeURIComponent(state.session.pairInvite)
            : '../pair/index.html'
        "
        >{{
          state.session.pairInvite ? "查看双人报告 ↗" : "邀请一个人一起测 ↗"
        }}</a
      >
    </div>
    <div class="result-actions">
      <button class="primary" @click="generate" :disabled="sharing">
        {{ sharing ? "正在绘制…" : "生成分享图" }} <span>↓</span></button
      ><button class="secondary" @click="copy">复制邀请链接 ↗</button
      ><button class="text-button" @click="review">回看并修改答案</button
      ><button class="text-button" @click="restart">重新探索 ↗</button>
    </div>
    <p class="page-disclaimer">
      相似不是复制，差异也不是缺点。你不必成为任何人的翻版。
    </p>
    <dialog
      ref="shareDialog"
      class="share-dialog"
      aria-labelledby="share-title"
      @click="
        (e) => {
          if (e.target === shareDialog) close();
        }
      "
    >
      <div class="share-dialog-top">
        <h2 id="share-title">把这次相遇，留给自己。</h2>
        <button class="text-button" @click="close" aria-label="关闭分享图">
          ✕
        </button>
      </div>
      <p>图片为 1080 × 1440。手机可长按保存，二维码指向人物邀请页。</p>
      <p
        v-if="['localhost', '127.0.0.1'].includes(windowHost())"
        class="local-share-note"
      >
        当前为本地预览，链接与二维码仅能在本机访问。
      </p>
      <img v-if="image" :src="image" :alt="figure.name + '人物画像分享图'" />
      <div class="center-actions">
        <a
          class="primary"
          :href="image"
          :download="'观己-' + figure.name + '.png'"
          >下载图片 ↓</a
        ><button class="text-button" @click="close">返回画像</button>
      </div>
    </dialog>
  </section>
</template>
<script>
export default {
  methods: {
    windowHost() {
      return location.hostname;
    },
  },
};
</script>

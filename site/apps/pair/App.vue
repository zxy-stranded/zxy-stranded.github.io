<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Shell from "../../shared/ToolShell.vue";
import { readLocal, copyText, writeLocal } from "../../shared/storage.js";
import { isValidSession, buildResult } from "../portrait/src/engine.js";
import {
  decodePartner,
  encodePartner,
  partnerLink,
  pairReport,
  pairFigure,
} from "./core.js";
const error = ref(""),
  notice = ref(""),
  link = ref(""),
  incoming = ref(null),
  own = ref(null),
  accepted = ref(false),
  ownSession = ref(null);
function loadOwn() {
  const s = readLocal("guanji:portrait:v2:session", null);
  try {
    if (isValidSession(s) && s.mode === "full") {
      own.value = buildResult(s);
      ownSession.value = s;
    }
  } catch {}
}
function loadInvitation() {
  loadOwn();
  incoming.value = null;
  accepted.value = false;
  error.value = "";
  const token =
    new URLSearchParams(location.hash.replace(/^#\??/, "")).get("a") ||
    new URL(location.href).searchParams.get("a");
  if (token)
    try {
      incoming.value = decodePartner(token);
      accepted.value = ownSession.value?.pairInvite === token;
    } catch (e) {
      error.value = e.message;
    }
}
onMounted(() => {
  loadInvitation();
  window.addEventListener("hashchange", loadInvitation);
});
onBeforeUnmount(() => window.removeEventListener("hashchange", loadInvitation));
const report = computed(() =>
  incoming.value && own.value && accepted.value
    ? pairReport(incoming.value.vec, own.value.vec)
    : null,
);
async function invite() {
  try {
    link.value = partnerLink(own.value.vec, location.href);
    notice.value = (await copyText(link.value))
      ? "邀请链接已复制"
      : "请从下方框中手动复制链接。";
  } catch (e) {
    error.value = e.message;
  }
}
function test(role) {
  if (role === "B" && !incoming.value) return;
  const url = new URL("../portrait/index.html", location.href);
  if (role === "B") url.hash = "/?pair=" + encodePartner(incoming.value.vec);
  else url.hash = "/?pairStart=1";
  location.href = url.href;
}
</script>
<template>
  <Shell
    title="两个人的选择，会怎样相遇？"
    kicker="TWO PEOPLE · TWO PERSPECTIVES"
    intro="完成同一份30题探索，看看你们相近的节奏，也为不同的地方找到一种说法。"
    ><p v-if="error" class="tool-error" role="alert">{{ error }}</p>
    <template v-if="report"
      ><div class="tool-grid">
        <section class="tool-panel">
          <span class="tool-badge">双人报告 · 八维参照</span>
          <h2 class="result-title">
            {{ pairFigure(incoming.id)?.name }} × {{ own.primary.figure.name }}
          </h2>
          <div class="metric">{{ report.close }}<small> / 8</small></div>
          <p>个维度的差距不超过 1.5 分</p>
          <p class="small">
            两人的八维接近程度 {{ report.similarity }}% · 不等于现实关系质量。
          </p>
          <div class="tool-note">
            <b
              >{{ pairFigure(report.relation.a)?.name }} ×
              {{ pairFigure(report.relation.b)?.name }}：{{
                report.relation.title
              }}</b
            >
            <p>{{ report.relation.description }}</p>
          </div>
          <p class="small">{{ report.relation.note }}</p>
        </section>
        <section class="tool-panel">
          <h2>相似之外，留一点理解</h2>
          <ul class="detail-list">
            <li>
              <b>可互补的侧面 · {{ report.complement.name }}</b
              >{{
                report.complement.gap < 1
                  ? "这一面你们相近，先用共同节奏配合即可。"
                  : "在行动、安排或表达上，各自多一点的部分可以成为协作资源。先问对方需要什么，别替对方分工。"
              }}
            </li>
            <li>
              <b>值得先聊聊 · {{ report.conflict.name }}</b
              >{{
                report.conflict.gap < 1
                  ? "这一面目前差异很小；分数不能替代真实沟通。"
                  : "在感受、体察或规则偏好上，容易把“我习惯这样”当成“你应该这样”。先交换期待。"
              }}
            </li>
          </ul>
          <div class="mini-bars">
            <div v-for="d in report.gaps" :key="d.id" class="mini-bar">
              <span>{{ d.name }}</span>
              <div>
                <div class="mini-track">
                  <i :style="{ width: d.a * 10 + '%' }" />
                </div>
                <div class="mini-track" style="margin-top: 5px">
                  <i
                    style="background: #a38ab8"
                    :style="{ width: d.b * 10 + '%' }"
                  />
                </div>
              </div>
              <small>{{ d.a.toFixed(1) }}<br />{{ d.b.toFixed(1) }}</small>
            </div>
          </div>
          <p class="small">绿：邀请者 · 紫：本机答题者。每维 1—10 分。</p>
        </section>
      </div>
      <div class="actions">
        <button class="tool-button" @click="invite">
          用我的结果，再邀请一位朋友 ↗</button
        ><a class="tool-secondary" href="../portrait/index.html#/result"
          >查看我的单人报告</a
        ><button class="tool-text" @click="test('B')">重新作答30题</button>
      </div></template
    ><template v-else
      ><div class="tool-grid">
        <section class="tool-panel">
          <span class="tool-badge">{{
            incoming ? "收到一份邀请" : "从你的选择开始"
          }}</span>
          <h2 style="margin-top: 20px">
            {{
              incoming
                ? `朋友的同频者是${pairFigure(incoming.id)?.name}`
                : "先有一份完整的自己，再谈两个人"
            }}
          </h2>
          <p class="muted">
            {{
              incoming
                ? "完成相同30题后，会同时生成你的单人结果与双人报告。如果当前浏览器已有完整30题结果，你也可以主动选择使用它作对照。"
                : "先完成30题完整版，即可复制含八维摘要的邀请链接。15题结果不与完整版混用。"
            }}
          </p>
          <button v-if="incoming" class="tool-button" @click="test('B')">
            开始我的30题探索 →</button
          ><button
            v-if="incoming && own"
            class="tool-text"
            @click="accepted = true"
          >
            使用本机已保存的完整版作对照</button
          ><button
            v-if="!incoming && !own"
            class="tool-button"
            @click="test('A')"
          >
            去完成30题 →</button
          ><button v-if="!incoming && own" class="tool-button" @click="invite">
            生成我的双人邀请链接 ↗
          </button>
          <p v-if="own && !incoming" class="small" style="margin-top: 20px">
            已读取本机完整版：{{ own.primary.figure.name }}
          </p>
        </section>
        <section class="tool-panel">
          <h2>不是评判关系，是打开话题</h2>
          <ol class="detail-list">
            <li>
              <b>01 · 发起者完成30题</b>邀请链接只包含八维摘要，不含原始答卷。
            </li>
            <li><b>02 · 朋友打开并作答</b>对方也会获得自己的单人画像。</li>
            <li>
              <b>03 · 一起读一份对照</b
              >18组历史关系是叙事参照，并非现实关系的结论。
            </li>
          </ol>
        </section>
      </div></template
    >
    <div v-if="link" class="tool-note">
      <label
        >邀请链接<input
          class="link-input"
          :value="link"
          readonly
          @focus="$event.target.select()"
      /></label>
      <p>链接携带可读的八维分数，仅发给你愿意分享的人。无账号与防篡改验证。</p>
    </div>
    <p class="tool-status" role="status">{{ notice }}</p>
    <details class="tool-details">
      <summary>计算与隐私说明</summary>
      <p>
        接近程度 = 100 × [1 − 八维绝对差之和 ÷
        72]；相近维度阈值为1.5分。关系原型比较双方与18组参考向量的双向欧氏距离，允许互换顺序。互补与讨论点分别从行动/沟通维度、感受/规则维度中选差异最大者，不把差异直接解释为好坏。
      </p>
      <p>
        完整答卷只在各自浏览器保存；邀请者摘要在URL里，可被接收者读取。分享前由你主动生成，无后台收集。
      </p>
    </details></Shell
  >
</template>

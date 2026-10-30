import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import Home from "./views/Home.vue";
import Quiz from "./views/Quiz.vue";
import Result from "./views/Result.vue";
import Gallery from "./views/Gallery.vue";
import Detail from "./views/Detail.vue";
import Invite from "./views/Invite.vue";
import Loading from "./views/Loading.vue";
import { state, complete, persist, notify } from "./store.js";
import { figureFor } from "./engine.js";
import { encodeResultBackup, decodeResultBackup } from "./result-backup.js";
import "./style.css";
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/quiz", component: Quiz },
    { path: "/loading", component: Loading },
    { path: "/result", component: Result },
    { path: "/gallery", component: Gallery },
    { path: "/figure/:id", component: Detail },
    { path: "/invite/:id", component: Invite },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior(to, from) {
    if (to.path === from.path) return;
    return { top: 0 };
  },
});
router.beforeEach((to, from) => {
  if (to.path === "/result") {
    // URL recovery runs before the result guard so a new browser needs no local storage.
    const token = to.query.restore;
    const returningFromAnswers =
      ["/quiz", "/loading"].includes(from.path) && complete.value;
    if (token !== undefined && !returningFromAnswers) {
      try {
        const recovered = decodeResultBackup(token);
        if (!complete.value || encodeResultBackup(state.session) !== token) {
          state.session = recovered;
          persist();
          notify(
            state.saving
              ? "已从结果地址恢复这次测试"
              : "已恢复结果；当前浏览器不允许保存，请保留结果地址",
          );
        }
      } catch (e) {
        notify(e.message);
        return { path: "/", replace: true };
      }
    }
    if (complete.value) {
      const backup = encodeResultBackup(state.session);
      if (token !== backup)
        return { path: "/result", query: { restore: backup }, replace: true };
    }
  }
  if (to.path === "/quiz" && !state.session) return "/";
  if (["/result", "/loading"].includes(to.path) && !complete.value) return "/";
  if (to.params.id && !figureFor(to.params.id)) return "/";
  const r = new URLSearchParams(location.search).get("r");
  if (to.path === "/" && r && figureFor(r)) {
    const clean = new URL(location.href);
    clean.searchParams.delete("r");
    history.replaceState(history.state, "", clean.href);
    return "/invite/" + r;
  }
});
createApp(App).use(router).mount("#app");

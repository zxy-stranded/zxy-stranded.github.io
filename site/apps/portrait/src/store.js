import { reactive, computed } from "vue";
import {
  DATA_VERSION,
  isValidSession,
  questionIds,
  buildResult,
} from "./engine.js";
const KEY = "guanji:portrait:v2:session";
let restored = null;
try {
  const parsed = JSON.parse(localStorage.getItem(KEY));
  if (isValidSession(parsed)) restored = parsed;
} catch {}
export const state = reactive({
  session: restored,
  saving: true,
  toast: "",
  shareImage: "",
  shareBusy: false,
});
export const complete = computed(
  () =>
    state.session &&
    questionIds(state.session.mode).every((id) => state.session.answers[id]),
);
export const result = computed(() =>
  complete.value ? buildResult(state.session) : null,
);
let toastTimer;
export function notify(message) {
  clearTimeout(toastTimer);
  state.toast = message;
  toastTimer = setTimeout(() => (state.toast = ""), 3200);
}
export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state.session));
    state.saving = true;
  } catch {
    state.saving = false;
  }
}
export function start(mode) {
  state.session = { version: DATA_VERSION, mode, index: 0, answers: {} };
  persist();
}
export function setAnswer(id, value) {
  state.session.answers[id] = value;
  persist();
}
export function setIndex(index) {
  state.session.index = index;
  persist();
}

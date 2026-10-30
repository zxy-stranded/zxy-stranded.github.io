import test from "node:test";
import assert from "node:assert/strict";
import { createRotation } from "../site/assets/home.js";
function fixture(count = 6) {
  let next = 0;
  const timers = new Map(),
    changes = [];
  const controller = createRotation(count, {
    interval: 6000,
    schedule: (fn) => {
      timers.set(++next, fn);
      return next;
    },
    cancel: (id) => timers.delete(id),
    onChange: (state) => changes.push(state),
  });
  return {
    controller,
    timers,
    changes,
    tick() {
      const entry = timers.entries().next().value;
      if (!entry) return false;
      timers.delete(entry[0]);
      entry[1]();
      return true;
    },
  };
}
test("首页推荐按六项顺序循环，不漏项且只保留一个计时器", () => {
  const f = fixture();
  const seen = [f.controller.state.index];
  for (let i = 0; i < 6; i++) {
    assert(f.tick());
    seen.push(f.controller.state.index);
    assert.equal(f.timers.size, 1);
  }
  assert.deepEqual(seen, [0, 1, 2, 3, 4, 5, 0]);
});
test("暂停、悬停和页面隐藏分别阻止轮播，移除阻塞后才继续", () => {
  const f = fixture();
  f.controller.setHovered(true);
  assert(!f.tick());
  f.controller.setHidden(true);
  f.controller.setHovered(false);
  assert(!f.tick());
  f.controller.setHidden(false);
  assert(f.tick());
  assert.equal(f.controller.state.index, 1);
  f.controller.setPaused(true);
  assert(!f.tick());
  f.controller.setHidden(true);
  f.controller.setHidden(false);
  assert(!f.tick());
  f.controller.setPaused(false);
  assert(f.tick());
});
test("悬停选择立即切换，移开后从当前项继续并支持末项回首项", () => {
  const f = fixture();
  f.controller.setHovered(true);
  f.controller.select(3);
  assert.equal(f.controller.state.index, 3);
  assert(!f.tick());
  f.controller.select(5);
  assert.equal(f.controller.state.index, 5);
  assert(!f.tick());
  f.controller.setHovered(false);
  assert.equal(f.timers.size, 1);
  assert(f.tick());
  assert.equal(f.controller.state.index, 0);
  f.controller.select(2);
  assert(f.tick());
  assert.equal(f.controller.state.index, 3);
  assert.throws(() => f.controller.select(-1));
  assert.throws(() => f.controller.select(6));
});
test("减少动态效果及焦点独立暂停，解除全部限制后恢复当前项", () => {
  const f = fixture();
  f.controller.setReducedMotion(true);
  f.controller.select(4);
  f.controller.setPaused(false);
  assert(!f.tick());
  f.controller.setPaused(true);
  f.controller.setReducedMotion(false);
  assert(!f.tick());
  f.controller.setPaused(false);
  assert(f.tick());
  assert.equal(f.controller.state.index, 5);
});
test("销毁会取消计时器，单项不自动轮播，外部不能直接改状态", () => {
  const f = fixture();
  f.controller.state.index = 4;
  assert.equal(f.controller.state.index, 0);
  f.controller.destroy();
  assert(!f.tick());
  f.controller.setPaused(false);
  assert.equal(f.timers.size, 0);
  assert(!fixture(1).tick());
  assert.throws(() => createRotation(0));
  assert.throws(() => createRotation(6, { interval: 0 }));
});
test("默认每3秒轮播，悬停后恢复会重新等待完整间隔", () => {
  let next = 0;
  const timers = new Map();
  const rotation = createRotation(6, {
    schedule: (fn, delay) => { timers.set(++next, { fn, delay }); return next; },
    cancel: id => timers.delete(id),
  });
  assert.equal([...timers.values()][0].delay, 3000);
  rotation.setHovered(true);
  rotation.select(4);
  assert.equal(timers.size, 0);
  rotation.setHovered(false);
  assert.equal([...timers.values()][0].delay, 3000);
  assert.equal(rotation.state.index, 4);
  rotation.destroy();
});
test("每日小问同一本地日期一致，次日轮换且允许无挂载节点", async () => {
  const { initDailyQuestion } = await import('../site/assets/home.js');
  const first = {}, same = {}, tomorrow = {};
  initDailyQuestion(first, new Date(2026, 9, 30, 0, 1));
  initDailyQuestion(same, new Date(2026, 9, 30, 23, 59));
  initDailyQuestion(tomorrow, new Date(2026, 9, 31, 0, 1));
  assert.equal(first.textContent, same.textContent);
  assert.notEqual(first.textContent, tomorrow.textContent);
  assert.doesNotThrow(() => initDailyQuestion(null));
});

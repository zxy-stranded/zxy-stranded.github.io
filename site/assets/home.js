// Small state machine shared by the page and timer tests; no runtime dependency.
export function createRotation(
  count,
  {
    interval = 3000,
    schedule = setTimeout,
    cancel = clearTimeout,
    onChange = () => {},
  } = {},
) {
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    !Number.isFinite(interval) ||
    interval <= 0
  )
    throw Error("Invalid rotation settings");
  const state = {
    index: 0,
    paused: false,
    hovered: false,
    hidden: false,
    reduced: false,
  };
  let timer = null,
    destroyed = false;
  const snapshot = () => ({ ...state });
  const canRun = () =>
    !destroyed &&
    count > 1 &&
    !state.paused &&
    !state.hovered &&
    !state.hidden &&
    !state.reduced;
  function sync() {
    if (timer !== null) cancel(timer);
    timer = null;
    if (canRun())
      timer = schedule(() => {
        timer = null;
        state.index = (state.index + 1) % count;
        onChange(snapshot());
        sync();
      }, interval);
  }
  function update(key, value) {
    if (destroyed) return;
    state[key] = Boolean(value);
    onChange(snapshot());
    sync();
  }
  sync();
  return {
    get state() {
      return snapshot();
    },
    setPaused: (value) => update("paused", value),
    setHovered: (value) => update("hovered", value),
    setHidden: (value) => update("hidden", value),
    setReducedMotion(value) {
      update("reduced", value);
    },
    select(index) {
      if (destroyed) return;
      if (!Number.isInteger(index) || index < 0 || index >= count)
        throw Error("Invalid slide");
      state.index = index;
      onChange(snapshot());
      sync();
    },
    move(step) {
      this.select((((state.index + step) % count) + count) % count);
    },
    destroy() {
      destroyed = true;
      if (timer !== null) cancel(timer);
      timer = null;
    },
  };
}

export function initSpotlight(root) {
  if (!root) return;
  const cards = [...document.querySelectorAll(".explore-card")];
  if (!cards.length) return;
  const track = root.querySelector(".spotlight-track");
  const controls = root.querySelector(".spotlight-controls");
  const dots = root.querySelector(".spotlight-dots");
  const live = root.querySelector(".spotlight-announcement");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const artwork = ["portrait", "pair", "daily", "network", "names", "reflection"];
  const titles = cards.map((card) => card.querySelector("h3").textContent);
  const slides = cards.map((card, i) => {
    const slide = document.createElement("a");
    slide.className = "spotlight-slide";
    slide.href = card.getAttribute("href");
    slide.setAttribute(
      "aria-label",
      `${titles[i]}：${card.querySelector("p").textContent}`,
    );
    const copy = document.createElement("div");
    copy.className = "spotlight-copy";
    const kicker = document.createElement("span");
    kicker.className = "spotlight-kicker";
    kicker.textContent = card.querySelector(".card-category").textContent;
    const title = document.createElement("h2");
    title.textContent = titles[i];
    const description = document.createElement("p");
    description.textContent = card.querySelector("p").textContent;
    const image = document.createElement("img");
    image.className = "spotlight-art";
    image.src = `./images/spotlight/${artwork[i]}.svg`;
    image.alt = "";
    image.width = 800;
    image.height = 450;
    image.draggable = false;
    copy.append(kicker, title, description);
    slide.append(image, copy);
    return slide;
  });
  const dotButtons = cards.map((card, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `展示第${i + 1}项：${titles[i]}`);
    button.append(document.createElement("span"));
    button.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      rotation.setHovered(true);
      select(i);
    });
    button.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") rotation.setHovered(false);
    });
    button.addEventListener("pointercancel", () => rotation.setHovered(false));
    button.addEventListener("focus", () => {
      if (button.matches(":focus-visible")) select(i);
    });
    button.addEventListener("click", () => select(i));
    return button;
  });
  // End clones let the last poster slide into the first without rewinding.
  const clone = (slide) => {
    const copy = slide.cloneNode(true);
    copy.inert = true;
    copy.setAttribute("aria-hidden", "true");
    copy.tabIndex = -1;
    copy.classList.add("spotlight-clone");
    return copy;
  };
  track.replaceChildren(clone(slides[slides.length - 1]), ...slides, clone(slides[0]));
  let displayedIndex = -1;
  let wrapping = false;
  const position = (index, animate = true) => {
    track.style.transition = animate && !motion.matches ? "" : "none";
    track.style.transform = `translate3d(${-index * 100}%, 0, 0)`;
  };
  const settleWrap = () => {
    if (!wrapping) return;
    position(displayedIndex + 1, false);
    wrapping = false;
  };
  track.addEventListener("transitionend", (event) => {
    if (event.target === track && event.propertyName === "transform") settleWrap();
  });
  dots.replaceChildren(...dotButtons);
  controls.hidden = false;
  const rotation = createRotation(cards.length, { onChange: render });
  function render(state) {
    if (displayedIndex !== state.index) {
      settleWrap();
      // Commit a clone reset before a rapid manual selection starts a new slide.
      if (track.style.transition === "none") void track.offsetWidth;
      const firstRender = displayedIndex < 0;
      const forwardWrap = displayedIndex === slides.length - 1 && state.index === 0;
      const backwardWrap = displayedIndex === 0 && state.index === slides.length - 1;
      const physicalIndex = forwardWrap ? slides.length + 1 : backwardWrap ? 0 : state.index + 1;
      displayedIndex = state.index;
      wrapping = !firstRender && !state.reduced && (forwardWrap || backwardWrap);
      position(firstRender || state.reduced ? state.index + 1 : physicalIndex, !firstRender);
    }
    if (state.reduced) settleWrap();
    slides.forEach((slide, i) => {
      const inactive = i !== state.index;
      slide.inert = inactive;
      slide.tabIndex = inactive ? -1 : 0;
      if (inactive) slide.setAttribute("aria-hidden", "true");
      else slide.removeAttribute("aria-hidden");
    });
    dotButtons.forEach((button, i) => {
      if (i === state.index) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }
  function select(index) {
    rotation.select(index);
    live.textContent = `正在展示第${index + 1}项：${titles[index]}`;
  }
  root.addEventListener("focusin", (event) => {
    if (event.target.matches(":focus-visible")) rotation.setPaused(true);
  });
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) rotation.setPaused(false);
  });
  const checkMotion = () => rotation.setReducedMotion(motion.matches);
  if (motion.addEventListener) motion.addEventListener("change", checkMotion);
  else motion.addListener(checkMotion);
  document.addEventListener("visibilitychange", () =>
    rotation.setHidden(document.hidden),
  );
  window.addEventListener("pagehide", () => rotation.setHidden(true));
  window.addEventListener("pageshow", () =>
    rotation.setHidden(document.hidden),
  );
  checkMotion();
  rotation.setHidden(document.hidden);
  render(rotation.state);
}
export function initDailyQuestion(root, date = new Date()) {
  if (!root) return;
  const questions = [
    "最近哪一件小事，\n让你觉得很像自己？",
    "如果今天慢一点，\n你最想留意什么？",
    "什么样的相处，\n让你不必刻意表现？",
    "有哪一个好奇，\n你一直想认真回应？",
    "放下别人的期待，\n你会怎样度过今天？",
    "最近一次改变主意，\n是因为什么？",
    "此刻的你，最想对\n一年前的自己说什么？",
  ];
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  root.textContent = questions[day % questions.length];
}
if (typeof document !== "undefined") {
  initSpotlight(document.querySelector(".spotlight"));
  initDailyQuestion(document.querySelector(".daily-question"));
}

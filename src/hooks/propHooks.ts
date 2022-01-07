const hooks = new Map<
  string,
  {
    get: <T = HTMLElement>(tween: Tween) => number | string;
    set: <T = HTMLElement>(tween: Tween) => void;
  }
>();

hooks.set("_default", {
  get({ elem, prop }) {
    var result;
    if (
      elem.nodeType !== 1 ||
      (elem[prop] != null && elem.style[prop] == null)
    ) {
      return elem[prop];
    }

    result = css(elem, prop, "");

    // Empty strings, null, undefined and "auto" are converted to 0.
    return !result || result === "auto" ? 0 : result;
  },
  set({ elem, prop, now, unit }) {
    if (step[prop]) {
      step[prop](elem, prop, now, unit);
    } else if (
      elem.nodeType === 1 &&
      (cssHooks[prop] ||
        elem.style[finalPropName(prop)] != null)
    ) {
      style(elem, prop, now + unit);
    } else {
      elem[prop] = now
    }
  },
});

each(["scrollTop", "scrollLeft"], (prop) => {
  hooks.set(prop, {
    set(elem, prop, nows) {
      if (elem.nodeType && elem.parentNode) {
        elem[prop] = nows[prop];
      }
    },
  });
});

export default hooks;

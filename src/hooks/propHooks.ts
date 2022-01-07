/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, cssHooks, each, finalPropName, style } from "kijs";

import Tween from "../core/Tween";
import steps from "../static/steps";

const hooks = new Map<
  string,
  {
    // eslint-disable-next-line functional/prefer-readonly-type
    get?: (tween: Tween<any>) => number;
    // eslint-disable-next-line functional/prefer-readonly-type
    set?: (tween: Tween<any>) => void;
  }
>();

hooks.set("_default", {
  get(tween) {
    if (
      tween.elem.nodeType !== 1 ||
      (tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null)
    ) {
      return tween.elem[tween.prop];
    }

    const result = css(tween.elem, tween.prop, "");

    // Empty strings, null, undefined and "auto" are converted to 0.
    return !result || result === "auto" ? 0 : result;
  },
  set(tween) {
    if (steps.has(tween.prop)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      steps.get(tween.prop)!.call(tween.elem, tween);
    } else if (
      tween.elem.nodeType === 1 &&
      (cssHooks.get(tween.prop) ||
        tween.elem.style[finalPropName(tween.prop)] != null)
    ) {
      style(tween.elem, tween.prop, tween.now + tween.unit);
    } else {
      // eslint-disable-next-line functional/immutable-data
      tween.elem[tween.prop] = tween.now;
    }
  },
});

each(["scrollTop", "scrollLeft"], (prop) => {
  hooks.set(prop, {
    set(tween) {
      if (tween.elem.nodeType && tween.elem.parentNode) {
        // eslint-disable-next-line functional/immutable-data
        tween.elem[tween.prop] = tween.now;
      }
    },
  });
});

export default hooks;

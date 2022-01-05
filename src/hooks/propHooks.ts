const hooks = new Map<
  string,
  {
    get: (tween: Tween) => number | string;
    set: (tween: Tween) => void;
  }
>();

hooks.set("_default", {
  get(tween) {
    var result;
    if (
      tween.elem.nodeType !== 1 ||
      (tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null)
    ) {
      return tween.elem[tween.prop];
    }

    result = jQuery.css(tween.elem, tween.prop, "");

    // Empty strings, null, undefined and "auto" are converted to 0.
    return !result || result === "auto" ? 0 : result;
  },
  set(tween) {
    // Use step hook for back compat.
    // Use cssHook if its there.
    // Use .style if available and use plain properties where available.
    if (Tween.step[tween.prop]) {
      Tween.step[tween.prop](tween);
    } else if (
      tween.elem.nodeType === 1 &&
      (jQuery.cssHooks[tween.prop] ||
        tween.elem.style[finalPropName(tween.prop)] != null)
    ) {
      jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
    } else {
      tween.elem[tween.prop] = tween.now;
    }
  },
});

each(["scrollTop", "scrollLeft"], (prop) => {
  hooks.set(prop, {
    set(tween) {
      if (tween.elem.nodeType && tween.elem.parentNode) {
        tween.elem[prop] = tween.now;
      }
    },
  });
});

export default hooks;

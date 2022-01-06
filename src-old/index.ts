var fxNow,
  inProgress,
  rfxtypes = /^(?:toggle|show|hide)$/,
  rrun = /queueHooks$/;

class Callbacks<T> extends CallbacksQueue {
  [key: keyof T]: T[key];

  done = this.then;
  fail = this.fail;
  always = this.finally;

  constructor(args: T) {
    super();

    Object.assign(this, args);
  }

  #progressCbs = [];
  progress(cb: Function) {
    this.#progressCbs.push(cb);
  }
  notifyWith(self: any, data: any[]) {
    this.#progressCbs.forEach((cb) => cb.call(self, ...data));
  }
}

function schedule() {
  if (inProgress) {
    if (document.hidden === false && window.requestAnimationFrame) {
      window.requestAnimationFrame(schedule);
    } else {
      window.setTimeout(schedule, Tween.interval);
    }

    Tween.tick();
  }
}

// Animations created synchronously will run synchronously
function createFxNow() {
  window.setTimeout(function () {
    fxNow = undefined;
  });
  return (fxNow = Date.now());
}

// Generate parameters to create a standard animation
function genFx(type, includeWidth) {
  var which,
    i = 0,
    attrs = { height: type };

  // If we include width, step value is 1 to do all cssExpand values,
  // otherwise step value is 2 to skip over Left and Right
  includeWidth = includeWidth ? 1 : 0;
  for (; i < 4; i += 2 - includeWidth) {
    which = cssExpand[i];
    attrs["margin" + which] = attrs["padding" + which] = type;
  }

  if (includeWidth) {
    attrs.opacity = attrs.width = type;
  }

  return attrs;
}

function createTween(value, prop, animation) {
  var tween,
    collection = (Animation.tweeners[prop] || []).concat(
      Animation.tweeners["*"]
    ),
    index = 0,
    length = collection.length;
  for (; index < length; index++) {
    if ((tween = collection[index].call(animation, prop, value))) {
      // We're done with this property
      return tween;
    }
  }
}

function defaultPrefilter(elem, props, opts) {
  var prop,
    value,
    toggle,
    hooks,
    oldfire,
    propTween,
    restoreDisplay,
    display,
    isBox = "width" in props || "height" in props,
    anim = this,
    orig = {},
    style = elem.style,
    hidden = elem.nodeType && isHiddenWithinTree(elem),
    dataShow = dataPriv.get(elem, "fxshow");

  // Queue-skipping animations hijack the fx hooks
  if (!opts.queue) {
    hooks = _queueHooks(elem, "fx");
    if (hooks.unqueued == null) {
      hooks.unqueued = 0;
      oldfire = hooks.empty.fire;
      hooks.empty.fire = function () {
        if (!hooks.unqueued) {
          oldfire();
        }
      };
    }
    hooks.unqueued++;

    anim.always(function () {
      // Ensure the complete handler is called before this completes
      anim.always(function () {
        hooks.unqueued--;
        if (!queue(elem, "fx").length) {
          hooks.empty.fire();
        }
      });
    });
  }

  // Detect show/hide animations
  for (prop in props) {
    value = props[prop];
    if (rfxtypes.test(value)) {
      delete props[prop];
      toggle = toggle || value === "toggle";
      if (value === (hidden ? "hide" : "show")) {
        // Pretend to be hidden if this is a "show" and
        // there is still data from a stopped show/hide
        if (value === "show" && dataShow && dataShow[prop] !== undefined) {
          hidden = true;

          // Ignore all other no-op show/hide data
        } else {
          continue;
        }
      }
      orig[prop] = (dataShow && dataShow[prop]) || style(elem, prop);
    }
  }

  // Bail out if this is a no-op like .hide().hide()
  propTween = !isEmptyObject(props);
  if (!propTween && isEmptyObject(orig)) {
    return;
  }

  // Restrict "overflow" and "display" styles during box animations
  if (isBox && elem.nodeType === 1) {
    // Support: IE <=9 - 11, Edge 12 - 15
    // Record all 3 overflow attributes because IE does not infer the shorthand
    // from identically-valued overflowX and overflowY and Edge just mirrors
    // the overflowX value there.
    opts.overflow = [style.overflow, style.overflowX, style.overflowY];

    // Identify a display type, preferring old show/hide data over the CSS cascade
    restoreDisplay = dataShow && dataShow.display;
    if (restoreDisplay == null) {
      restoreDisplay = dataPriv.get(elem, "display");
    }
    display = css(elem, "display");
    if (display === "none") {
      if (restoreDisplay) {
        display = restoreDisplay;
      } else {
        // Get nonempty value(s) by temporarily forcing visibility
        showHide([elem], true);
        restoreDisplay = elem.style.display || restoreDisplay;
        display = css(elem, "display");
        showHide([elem]);
      }
    }

    // Animate inline elements as inline-block
    if (
      display === "inline" ||
      (display === "inline-block" && restoreDisplay != null)
    ) {
      if (css(elem, "float") === "none") {
        // Restore the original display value at the end of pure show/hide animations
        if (!propTween) {
          anim.done(function () {
            style.display = restoreDisplay;
          });
          if (restoreDisplay == null) {
            display = style.display;
            restoreDisplay = display === "none" ? "" : display;
          }
        }
        style.display = "inline-block";
      }
    }
  }

  if (opts.overflow) {
    style.overflow = "hidden";
    anim.always(function () {
      style.overflow = opts.overflow[0];
      style.overflowX = opts.overflow[1];
      style.overflowY = opts.overflow[2];
    });
  }

  // Implement show/hide animations
  propTween = false;
  for (prop in orig) {
    // General show/hide setup for this element animation
    if (!propTween) {
      if (dataShow) {
        if ("hidden" in dataShow) {
          hidden = dataShow.hidden;
        }
      } else {
        dataShow = dataPriv.access(elem, "fxshow", { display: restoreDisplay });
      }

      // Store hidden/visible for toggle so `.stop().toggle()` "reverses"
      if (toggle) {
        dataShow.hidden = !hidden;
      }

      // Show elements before animating them
      if (hidden) {
        showHide([elem], true);
      }

      /* eslint-disable no-loop-func */

      anim.done(function () {
        /* eslint-enable no-loop-func */

        // The final step of a "hide" animation is actually hiding the element
        if (!hidden) {
          showHide([elem]);
        }
        dataPriv.remove(elem, "fxshow");
        for (prop in orig) {
          style(elem, prop, orig[prop]);
        }
      });
    }

    // Per-property setup
    propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
    if (!(prop in dataShow)) {
      dataShow[prop] = propTween.start;
      if (hidden) {
        propTween.end = propTween.start;
        propTween.start = 0;
      }
    }
  }
}

function propFilter(props, specialEasing) {
  var index, name, easing, value, hooks;

  // camelCase, specialEasing and expand cssHook pass
  for (index in props) {
    name = camelCase(index);
    easing = specialEasing[name];
    value = props[index];
    if (Array.isArray(value)) {
      easing = value[1];
      value = props[index] = value[0];
    }

    if (index !== name) {
      props[name] = value;
      delete props[index];
    }

    hooks = cssHooks[name];
    if (hooks && "expand" in hooks) {
      value = hooks.expand(value);
      delete props[name];

      // Not quite $.extend, this won't overwrite existing keys.
      // Reusing 'index' because we have the correct "name"
      for (index in value) {
        if (!(index in props)) {
          props[index] = value[index];
          specialEasing[index] = easing;
        }
      }
    } else {
      specialEasing[name] = easing;
    }
  }
}

function Animation(elem, properties, options) {
  var result,
    stopped,
    index = 0,
    length = Animation.prefilters.length,
    animation = new Callbacks({
      elem: elem,
      props: extend({}, properties),
      opts: extend(
        true,
        {
          specialEasing: {},
          easing: easing._default,
        },
        options
      ),
      originalProperties: properties,
      originalOptions: options,
      startTime: fxNow || createFxNow(),
      duration: options.duration,
      tweens: [],
      createTween(prop, end) {
        var tween = new Tween(
          elem,
          animation.opts,
          prop,
          end,
          animation.opts.specialEasing[prop] || animation.opts.easing
        );
        animation.tweens.push(tween);
        return tween;
      },
      stop(gotoEnd) {
        var index = 0,
          // If we are going to the end, we want to run all the tweens
          // otherwise we skip this part
          length = gotoEnd ? animation.tweens.length : 0;
        if (stopped) {
          return this;
        }
        stopped = true;
        for (; index < length; index++) {
          animation.tweens[index].run(1);
        }

        // Resolve when we played the last frame; otherwise, reject
        if (gotoEnd) {
          animation.notifyWith(elem, [animation, 1, 0]);
          animation.resolve([animation, gotoEnd]);
        } else {
          animation.reject([animation, gotoEnd]);
        }
        return this;
      },
    }).finally(() => {
      // Don't match elem in the :animated selector
      delete tick.elem;
    }),
    tick = function () {
      if (stopped) {
        return false;
      }
      var currentTime = fxNow || createFxNow(),
        remaining = Math.max(
          0,
          animation.startTime + animation.duration - currentTime
        ),
        // Support: Android 2.3 only
        // Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
        temp = remaining / animation.duration || 0,
        percent = 1 - temp,
        index = 0,
        length = animation.tweens.length;

      for (; index < length; index++) {
        animation.tweens[index].run(percent);
      }

      animation.notifyWith(elem, [animation, percent, remaining]);

      // If there's more to do, yield
      if (percent < 1 && length) {
        return remaining;
      }

      // If this was an empty animation, synthesize a final progress notification
      if (!length) {
        animation.notifyWith(elem, [animation, 1, 0]);
      }

      // Resolve the animation and report its conclusion
      animation.resolve([animation]);
      return false;
    },
    props = animation.props;

  propFilter(props, animation.opts.specialEasing);

  for (; index < length; index++) {
    result = Animation.prefilters[index].call(
      animation,
      elem,
      props,
      animation.opts
    );
    if (result) {
      if (isFunction(result.stop)) {
        _queueHooks(animation.elem, animation.opts.queue).stop =
          result.stop.bind(result);
      }
      return result;
    }
  }

  map(props, createTween, animation);

  if (isFunction(animation.opts.start)) {
    animation.opts.start.call(elem, animation);
  }

  // Attach callbacks from options
  animation
    .progress(animation.opts.progress)
    .done(animation.opts.done, animation.opts.complete)
    .fail(animation.opts.fail)
    .always(animation.opts.always);

  Tween.timer(
    extend(tick, {
      elem: elem,
      anim: animation,
      queue: animation.opts.queue,
    })
  );

  return animation;
}

extend(Animation, {
  tweeners: {
    "*": [
      function (prop, value) {
        var tween = this.createTween(prop, value);
        adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
        return tween;
      },
    ],
  },

  tweener(props, callback) {
    if (isFunction(props)) {
      callback = props;
      props = ["*"];
    } else {
      props = props.match(rnothtmlwhite);
    }

    var prop,
      index = 0,
      length = props.length;

    for (; index < length; index++) {
      prop = props[index];
      Animation.tweeners[prop] = Animation.tweeners[prop] || [];
      Animation.tweeners[prop].unshift(callback);
    }
  },

  prefilters: [defaultPrefilter],

  prefilter(callback, prepend) {
    if (prepend) {
      Animation.prefilters.unshift(callback);
    } else {
      Animation.prefilters.push(callback);
    }
  },
});

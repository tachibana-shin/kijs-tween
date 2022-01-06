class Tween {
  static step = {};
  static tick() {
    var timer,
      i = 0,
      timers = jQuery.timers;

    fxNow = Date.now();

    for (; i < timers.length; i++) {
      timer = timers[i];

      // Run the timer and safely remove it when done (allowing for external removal)
      if (!timer() && timers[i] === timer) {
        timers.splice(i--, 1);
      }
    }

    if (!timers.length) {
      Tween.stop();
    }
    fxNow = undefined;
  }
  static timer(timer) {
    jQuery.timers.push(timer);
    Tween.start();
  }
  static interval = 13;
  static start() {
    if (inProgress) {
      return;
    }

    inProgress = true;
    schedule();
  }
  static stop() {
    inProgress = null;
  }
  static speeds = {
    slow: 600,
    fast: 200,

    // Default speed
    _default: 400,
  };

  constructor(elem, options, prop, end, easing, unit) {
    this.elem = elem;
    this.prop = prop;
    this.easing = easing || jQuery.easing._default;
    this.options = options;
    this.start = this.now = this.cur();
    this.end = end;
    this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
  }
  cur() {
    const hooks = propHooks.get(this.prop);

    return hooks && hooks.get
      ? hooks.get(this)
      : propHooks.get("_default")!.get(this);
  }
  run(percent) {
    var eased,
      hooks = propHooks.get(this.prop);

    if (this.options.duration) {
      this.pos = eased = jQuery.easing[this.easing](
        percent,
        this.options.duration * percent,
        0,
        1,
        this.options.duration
      );
    } else {
      this.pos = eased = percent;
    }
    this.now = (this.end - this.start) * eased + this.start;

    if (this.options.step) {
      this.options.step.call(this.elem, this.now, this);
    }

    if (hooks && hooks.set) {
      hooks.set(this);
    } else {
      propHooks.get("_default")!.set(this);
    }
    return this;
  }
}

export default Tween;

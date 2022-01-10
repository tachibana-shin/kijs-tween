/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getAll as getAllByTweenjs,
  Interpolation,
  Tween as TweenByTweenjs,
  update as updateByTweenjs,
} from "@tweenjs/tween.js";
import { adjustCSS, css, cssNumber, each, extend, Kijs } from "kijs";

import genFx from "../helpers/genFx";
import isHiddenWithinTree from "../helpers/isHiddenWithinTree";
import showHide, { getDisplayElementInCache } from "../helpers/showHide";
import propHooks from "../hooks/propHooks";
import easings from "../static/easings";
import speeds from "../static/speeds";

type Options<El = any> = {
  readonly duration: keyof typeof speeds | number;
  readonly easing: ((k: number) => number) | string;
  // eslint-disable-next-line functional/prefer-readonly-type
  readonly interpolation: ((v: number[], k: number) => number) | string;
  readonly queue?: false | string;
  readonly specialEasing?: {
    readonly [prop: string]: ((k: number) => number) | string;
  };
  readonly step?: (this: El, now: number, tween: Tween<El>) => void;
  readonly progress?: (
    this: El,
    tween: Tween<El>,
    animation: number,
    remainingMs: number
  ) => void;
  readonly complete?: (this: El) => void;
  readonly start?: (this: El, animation: Promise<void>) => void;

  readonly done?: () => void;
  readonly fail?: () => void;
  readonly always?: () => void;
};

// eslint-disable-next-line functional/no-let
let isRunning = false;
function _update() {
  if (getAllByTweenjs().length === 0) {
    isRunning = false;
    return; // stop
  }

  isRunning = true;

  updateByTweenjs();

  requestAnimationFrame(_update);
}
function update() {
  if (isRunning === false) _update();
}
class Tween<El extends any> {
  // eslint-disable-next-line functional/prefer-readonly-type
  readonly tween: TweenByTweenjs<{ value: number }>;

  readonly elem: El;
  readonly start: number;
  readonly end: number;
  readonly unit: string;
  readonly dur: number;
  readonly options: Options<El>;
  // eslint-disable-next-line functional/prefer-readonly-type
  now: number;
  readonly prop: string;
  readonly promise: Promise<void>;
  readonly then: () => any;
  readonly catch: () => any;
  readonly finally: () => any;

  // eslint-disable-next-line functional/prefer-readonly-type
  onUpdateCbs?: Set<(tween: this) => void>;
  // eslint-disable-next-line functional/prefer-readonly-type
  onStartCbs?: Set<(tween: this) => void>;
  // eslint-disable-next-line functional/prefer-readonly-type
  onCompleteCbs?: Set<(tween: this) => void>;
  // eslint-disable-next-line functional/prefer-readonly-type
  onStopCbs?: Set<(tween: this) => void>;

  constructor(
    elem: El,
    prop: string,
    value: number | string,
    options: Options<El>,
    start?: number
  ) {
    this.elem = elem;
    this.options = options;
    this.prop = prop;

    const adjust = adjustCSS(elem, prop, value + "", () => this.cur());

    this.start = this.now = start ?? adjust.start;
    this.end = adjust.end;
    this.unit = adjust.unit || ((cssNumber as any)[prop] ? "" : "px");

    // eslint-disable-next-line functional/no-let
    let { duration } = options;
    if (typeof duration === "string") {
      duration = speeds[duration];
    }

    this.dur = duration;
    this.tween = new TweenByTweenjs({
      value: this.start,
    });
    this.tween.to(
      {
        value: this.end,
      },
      duration
    );

    const easing = options.specialEasing?.[prop] || options.easing;
    this.tween.easing(
      typeof easing === "string"
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          easings.get(easing) || easings.get("_default")!
        : easing
    );
    const interpolation = options.interpolation || "linear";
    this.tween.interpolation(
      typeof interpolation === "string"
        ? Interpolation[
            interpolation as Exclude<keyof typeof Interpolation, "Utils">
          ]
        : interpolation
    );
    this.tween.onUpdate(({ value }) => {
      this.now = value;
      this.set();

      // call event;
      this.onUpdateCbs?.forEach((cb) => cb(this));
    });
    this.tween.onStart(() => {
      this.onStartCbs?.forEach((cb) => cb(this));
    });
    // eslint-disable-next-line functional/no-let
    let res: { (): void; (value: void | PromiseLike<void>): void },
      rej: { (): void; (reason?: any): void };
    this.tween.onComplete(() => {
      this.onCompleteCbs?.forEach((cb) => cb(this));
      res();
    });
    this.tween.onStop(() => {
      this.onStopCbs?.forEach((cb) => cb(this));
      rej();
    });

    this.promise = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    this.then = this.promise.then.bind(this.promise);
    this.catch = this.promise.catch.bind(this.promise);
    this.finally = this.promise.finally.bind(this.promise);

    // call if is not of queue this.start();
  }

  cur(): number {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return (propHooks.get(this.prop)?.get || propHooks.get("_default")!.get!)(
      this
    );
  }
  set() {
    this.options.step?.call(this.elem, this.now, this);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (propHooks.get(this.prop)?.set || propHooks.get("_default")!.set!)(this);
  }

  onUpdate(cb: (tween: this) => void): this {
    if (!this.onUpdateCbs) {
      this.onUpdateCbs = new Set();
    }
    this.onUpdateCbs.add(cb);

    return this;
  }
  onStart(cb: (tween: this) => void): this {
    if (!this.onStartCbs) {
      this.onStartCbs = new Set();
    }
    this.onStartCbs.add(cb);

    return this;
  }
  onComplete(cb: (tween: this) => void): this {
    if (!this.onCompleteCbs) {
      this.onCompleteCbs = new Set();
    }
    this.onCompleteCbs.add(cb);

    return this;
  }
  onStop(cb: (tween: this) => void): this {
    if (!this.onStopCbs) {
      this.onStopCbs = new Set();
    }
    this.onStopCbs.add(cb);

    return this;
  }
  onFinally(cb: (tween: this) => void): this {
    this.onComplete(cb).onStop(cb);

    return this;
  }
}

const rfxtypes = /^(?:toggle|show|hide)$/;
function createTweensByProps(
  elem: any,
  props: {
    readonly [key: string]: number | string;
  },
  options: Options<any>
): {
  readonly promise: Promise<void>;
  readonly tweens?: readonly Tween<any>[];
  readonly hooks?: {
    // eslint-disable-next-line functional/prefer-readonly-type
    [name: string]: () => void;
  };
  readonly name: string;
} {
  // eslint-disable-next-line functional/prefer-readonly-type
  const tweens: Tween<any>[] = [];
  const isBox = "width" in props || "height" in props; // is enable overflow
  const isHidden = elem.nodeType && isHiddenWithinTree(elem);
  // eslint-disable-next-line functional/no-let
  let enableModeFx = false; // is enable display
  const valueStylesBackup: Partial<typeof props> = {};

  // eslint-disable-next-line functional/no-loop-statement
  for (const prop in props) {
    if (rfxtypes.exec(props[prop] + "")) {
      const type =
        props[prop] === "toggle" ? (isHidden ? "show" : "hide") : props[prop];

      if (isHidden === (type === "hide")) {
        // if elem hidden and type = "hide" -> pass
        // if elem not hidden and type = "show" -> pass
        continue;
      }

      enableModeFx = true; // no set true if can't run tween

      if (type === "show") {
        // no set to 0
        // get value from backup
        // eslint-disable-next-line functional/immutable-data
        valueStylesBackup[prop] = elem.style[prop] || "";
        const valueTo = css(elem, prop); // get style of me
        if (valueTo !== void 0) {
          // eslint-disable-next-line functional/immutable-data
          tweens.push(new Tween(elem, prop, valueTo, options, 0));
        }
      } else {
        // eslint-disable-next-line functional/immutable-data
        valueStylesBackup[prop] = elem.style[prop] || "";

        // eslint-disable-next-line functional/immutable-data
        tweens.push(new Tween(elem, prop, 0, options));
      }
    } else {
      // eslint-disable-next-line functional/immutable-data
      tweens.push(new Tween(elem, prop, props[prop], options));
    }
  }

  if (options.progress) {
    tweens[0]?.onUpdate((tween) => {
      options.progress?.call(
        tween.elem,
        tween,
        tween.now / tween.end,
        tween.dur * (1 - tween.now / tween.end)
      );
    });
  }

  const promise = Promise.all(tweens)
    .then(() => void options.done?.call(elem))
    .finally(() => void options.complete?.call(elem))
    .catch(() => void options.fail?.call(elem))
    .finally(() => void options.always?.call(elem));

  // / before start
  if (isBox) {
    // set overflow hidden on start
    tweens[0]?.onStart(() => {
      // backup overflow
      const overflowsBackup = [
        elem.style.overflow || "",
        elem.style.overflowX || "",
        elem.style.overflowY || "",
      ];

      // eslint-disable-next-line functional/immutable-data
      elem.style.overflowX = elem.style.overflowY = "";
      // eslint-disable-next-line functional/immutable-data
      elem.style.overflow = "hidden";
      tweens[tweens.length - 1].onFinally(() => {
        if (overflowsBackup) {
          // restore
          [elem.style.overflow, elem.style.overflowX, elem.style.overflowY] =
            overflowsBackup;
        }
      });
    });
  }
  if (enableModeFx) {
    /* displayBackup = getDisplayElementInCache()
		const display = css( elem, "display" );
		if ( display === "none" ) {
			if ( displayBackup ) {
				display = displayBackup;
			} else {
				showHide( [ elem ], true );
				displayBackup = elem.style.display || displayBackup;
				display = css( elem, "display" );
				showHide( [ elem ] , false );
			}
		}

		if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
			if ( css( elem, "float" ) === "none" ) {
					promise.finally( () => {
						elem.style.display = restoreDisplay;
					} );
					if ( restoreDisplay == null ) {
						display = elem.style.display;
						restoreDisplay = display === "none" ? "" : display;
					}
				
			elem.style.display = "inline-block";
			}
		}
    // backup display;
    displayBackup = elem.style.display || ""
    tweens[0]?.onStart(() => {
      
    })*/

    tweens[0]?.onStart(() => {
      // eslint-disable-next-line functional/no-let
      let displayBackup = elem.nodeType && getDisplayElementInCache(elem); // never "none"
      // eslint-disable-next-line functional/no-let
      let display = css(elem, "display");
      if (display === "none") {
        if (displayBackup) {
          display = displayBackup;
        } else {
          showHide([elem], true);
          displayBackup = elem.style.display || displayBackup;
          display = css(elem, "display");
          showHide([elem], false);
        }
      }

      if (display === "inline") {
        // eslint-disable-next-line functional/immutable-data
        elem.style.display = "inline-block";
      }

      showHide([elem], true);
      tweens[tweens.length - 1].onComplete(() => {
        if (isHidden) {
          // eslint-disable-next-line functional/immutable-data
          elem.style.display = displayBackup;
        } else {
          showHide([elem], false);
        }

        // tween complete -> restore value
        // eslint-disable-next-line functional/no-loop-statement
        for (const prop in valueStylesBackup) {
          // eslint-disable-next-line functional/immutable-data
          elem.style[prop] = valueStylesBackup[prop];
        }
      });
    });
  }

  if (options.start) {
    tweens[0]?.onStart(() => options.start?.call(elem, promise));
  }

  // startTweens(tweens);

  return {
    promise,
    tweens,
    name: options.queue === void 0 ? "__unknown__" : options.queue || "fx",
  };
}
function startTweens(
  tweens: ReturnType<typeof createTweensByProps>["tweens"]
): void {
  tweens?.forEach((tween) => tween.tween.start());

  update();
}

type FunctionQueue =
  | ((
      next: () => void,
      hooks: {
        // eslint-disable-next-line functional/prefer-readonly-type
        [name: string]: () => void;
      }
    ) => void)
  | (() => void | Promise<void>);
// eslint-disable-next-line functional/prefer-readonly-type
type SetAnimateQueue = Set<
  | {
      readonly props: Record<string, string | number>;
      readonly options: Options<any>;
    }
  | FunctionQueue
>;
const storeWeakAnimate = new WeakMap<
  any,
  // eslint-disable-next-line functional/prefer-readonly-type
  Map<string, SetAnimateQueue>
>();
const storeWeakTweenPropsRunning = new WeakMap<
  any,
  // eslint-disable-next-line functional/prefer-readonly-type
  Set<ReturnType<typeof createTweensByProps>>
>();

function initWeakAnimate(elem: any, queueName: string): void {
  if (storeWeakAnimate.has(elem) === false) {
    storeWeakAnimate.set(elem, new Map());
  } // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (storeWeakAnimate.get(elem)!.has(queueName) === false) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    storeWeakAnimate.get(elem)!.set(queueName, new Set());
  }
}
function initWeakTweenPropsRunning(elem: any) {
  if (storeWeakTweenPropsRunning.has(elem) === false) {
    storeWeakTweenPropsRunning.set(elem, new Set());
  }
}
const storeWeakTweenPropsRunningStateQueue = new WeakMap<
  any,
  // eslint-disable-next-line functional/prefer-readonly-type
  Map<string, true>
>();
function createPromiseByFnTween(
  argTween: FunctionQueue,
  hooks?: ReturnType<typeof createTweensByProps>["hooks"]
): Promise<void> {
  if (argTween.length > 0) {
    // case 1:
    return new Promise<void>((resolve) => {
      argTween(resolve, hooks || {});
    });
  }

  return (argTween as () => void | Promise<void>)() || Promise.resolve();
}
function startTweenQueueInStore(elem: any, queueName: string): void {
  if (storeWeakTweenPropsRunningStateQueue.get(elem)?.get(queueName)) {
    return;
  }

  if (
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    storeWeakAnimate.get(elem)!.has(queueName) &&
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    storeWeakAnimate.get(elem)!.get(queueName)!.size > 0
  ) {
    /* if (storeWeakTweenPropsRunning.has(elem)) {
      // call fs
    } else */ {
      const argTween = Array.from(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        storeWeakAnimate.get(elem)!.get(queueName)!.values()
      )[0];

      const hooks: ReturnType<typeof createTweensByProps>["hooks"] =
        typeof argTween === "function" ? {} : void 0;
      const tweenProps =
        typeof argTween === "function"
          ? {
              promise: createPromiseByFnTween(argTween, hooks),
              hooks,
              name: queueName,
            }
          : createTweensByProps(elem, argTween.props, argTween.options);

      // hydration complete -> remove argTween in task
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      storeWeakAnimate.get(elem)!.get(queueName)!.delete(argTween);

      initWeakTweenPropsRunning(elem);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      storeWeakTweenPropsRunning.get(elem)!.add(tweenProps);

      if (storeWeakTweenPropsRunningStateQueue.has(elem) === false) {
        storeWeakTweenPropsRunningStateQueue.set(elem, new Map());
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      storeWeakTweenPropsRunningStateQueue.get(elem)!.set(queueName, true);

      tweenProps.promise.finally(() => {
        // call next
        // delete now
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        storeWeakTweenPropsRunning.get(elem)!.delete(tweenProps);

        // clear cache
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (storeWeakTweenPropsRunning.get(elem)!.size < 1) {
          storeWeakTweenPropsRunning.delete(elem);
        }

        storeWeakTweenPropsRunningStateQueue.get(elem)?.delete(queueName);

        // call next;
        startTweenQueueInStore(elem, queueName);
      });

      startTweens(tweenProps.tweens);
    }
    // start it -->
  }
}

function installer(Ki: typeof Kijs) {
  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.animate = function (props, duration?, easing?, complete?) {
    const options = extend(
      {
        duration: "_default",
        easing: "_default",
        complete,
        queue: true,
      },
      typeof duration !== "object"
        ? {
            duration,
            easing,
          }
        : duration
    );

    if (options.queue) {
      const queueName = options.queue === true ? "fx" : options.queue;

      this.each((elem) => {
        if (typeof elem !== "object" && typeof elem !== "function") {
          return void 0xa;
        }

        initWeakAnimate(elem, queueName);

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        storeWeakAnimate.get(elem)!.get(queueName)!.add({ props, options });

        startTweenQueueInStore(elem, queueName);
      });
    } else {
      // if options.queue == false: <-- no save to store
      this.each((elem) => {
        if (typeof elem !== "object" && typeof elem !== "function") {
          return void 0xa;
        }

        const tweenProps = createTweensByProps(elem, props, options);

        initWeakTweenPropsRunning(elem);

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        storeWeakTweenPropsRunning.get(elem)!.add(tweenProps);

        startTweens(tweenProps.tweens);
      });
    }

    return this;
  };
  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.clearQueue = function (queueName = "fx") {
    return this.each((elem) => {
      storeWeakAnimate.get(elem)?.get(queueName)?.clear();
    });
  };
  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.delay = function (ms, queueName = "fx") {
    if (typeof ms === "string") {
      ms = speeds[ms] || (speeds["_default"] as number);
    }

    return this.queue(queueName, (next, hooks) => {
      const timeout = setTimeout(next, ms as number);

      // eslint-disable-next-line functional/immutable-data
      hooks.stop = () => clearTimeout(timeout);
    });
  };
  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.dequeue = function (queueName = "fx") {
    return this.each((elem) => {
      startTweenQueueInStore(elem, queueName);
    });
  };

  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.fadeTo = function (
    speed,
    to,
    easing?,
    callback?: Options["complete"]
  ) {
    // Show any hidden elements after setting opacity to 0
    return this.filter(isHiddenWithinTree)
      .css("opacity", 0)
      .show()
      .end()
      .animate(
        { opacity: to },
        speed,
        callback === undefined ? "_default" : (easing as Options["easing"]),
        callback
      );
  };
  each(["toggle", "show", "hide"], (name) => {
    // eslint-disable-next-line functional/immutable-data
    (Ki.prototype as any)[name] = function (
      speed: any,
      easing: any,
      callback: any
    ) {
      if (speed === void 0 || typeof speed === "boolean") {
        if (speed === void 0) {
          if (name === "toggle") {
            return this.each((elem: HTMLElement) => {
              if (isHiddenWithinTree(elem)) {
                showHide([elem], true);
              } else {
                showHide([elem], false);
              }
            });
          }

          showHide(this, name === "show");
          return this;
        }

        return speed ? this.show() : this.hide();
      }

      return this.animate(genFx(name, true), speed, easing, callback);
    };
  });
  each(
    {
      slideDown: genFx("show"),
      slideUp: genFx("hide"),
      slideToggle: genFx("toggle"),

      fadeIn: { opacity: "show" },
      fadeOut: { opacity: "hide" },
      fadeToggle: { opacity: "toggle" },
    },
    (props, name) => {
      // eslint-disable-next-line functional/immutable-data
      (Ki.prototype as any)[name] = function (
        speed: any,
        easing: any,
        callback: any
      ) {
        return this.animate(
          props,
          speed,
          callback === void 0 ? "_default" : easing,
          callback
        );
      };
    }
  );

  function stopAllTweenRunning(elem: any, queueName: string, jumpToEnd: boolean): void {
    storeWeakTweenPropsRunning.get(elem)?.forEach((tweenProps) => {
      if (tweenProps.name === queueName) {
        tweenProps.tweens?.forEach((tween) => {
          if (jumpToEnd) {
            tween.tween.duration(0);
          } else {
            tween.tween.stop();
          }
        });
        tweenProps.hooks?.stop?.();
      }
    });
  }
  function jumpToEndTweenQueue(elem: any, queueName: string): void {
    storeWeakAnimate
      .get(elem)
      ?.get(queueName)
      ?.forEach((twn) => {
        if (typeof twn !== "function") {
          // eslint-disable-next-line functional/no-loop-statement
          for (const prop in twn.props) {
            const adjust = adjustCSS(
              elem,
              prop,
              twn.props[prop] + "",
              () => css(elem, prop, "") as number
            );
            const unit = adjust.unit || ((cssNumber as any)[prop] ? "" : "px");

            // eslint-disable-next-line functional/immutable-data
            elem.style[prop] = adjust.end + unit;
          }
        }
      });
  }
  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.finish = function (queueName = "fx") {
    // set queue to duration 0

    return this.each((elem) => {
      // stop tween running
      stopAllTweenRunning(elem, queueName, true);

      // stop all complete;

      // restore value;
      jumpToEndTweenQueue(elem, queueName);
    });
  };
  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.queue = function (
    queueName: string | FunctionQueue = "fx",
    cb?: FunctionQueue
  ): any {
    if (typeof queueName === "string") {
      return storeWeakAnimate.get(this[0])?.get(queueName) || new Set();
    }

    if (typeof queueName === "function") {
      cb = queueName;
      queueName = "fx";
    }

    return this.each((elem) => {
      initWeakAnimate(elem, queueName as string);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      storeWeakAnimate
        .get(elem)!
        .get(queueName as string)!
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .add(cb!);
    });
  };
  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.stop = function (queueName?, clearQueue?, jumpToEnd?: boolean) {
    if (typeof queueName === "boolean") {
      jumpToEnd = clearQueue;
      clearQueue = queueName;
      queueName = "fx";
    }

    return this.each((elem) => {
      // stop tween running
      stopAllTweenRunning(elem, queueName as string, jumpToEnd ?? false);
      // stop all complete;

      if (jumpToEnd) {
        // restore value;

        jumpToEndTweenQueue(elem, queueName as string);
      }

      if (clearQueue) {
        storeWeakAnimate
          .get(elem)
          ?.get(queueName as string)
          ?.clear();
      }
    });
  };
  each(["pause", "play"], (action) => {
    // eslint-disable-next-line functional/immutable-data
    (Ki.prototype as any)[action] = function (queueName = "fx") {
      return this.each((elem: any) => {
        storeWeakTweenPropsRunning.get(elem)?.forEach((tweenProps) => {
          if (queueName === tweenProps.name) {
            tweenProps.tweens?.forEach((tween) => {
              (tween.tween as any)[action]();
            });
            tweenProps.hooks?.[action]?.();
          }
        });
      });
    };
  });
}

export type { Options };
export default Tween;
export { installer };

declare module "kijs" {
  class Kijs {
    show(duration: Options["duration"], complete?: Options["complete"]): this;
    show(options?: Partial<Options>): this;
    show(
      duration: Options["duration"],
      easing: Options["easing"],
      complete: Options["complete"]
    ): this;
    hide(duration: Options["duration"], complete?: Options["complete"]): this;
    hide(options?: Partial<Options>): this;
    hide(
      duration: Options["duration"],
      easing: Options["easing"],
      complete: Options["complete"]
    ): this;
    toggle(duration: Options["duration"], complete?: Options["complete"]): this;
    toggle(options?: Partial<Options>): this;
    toggle(
      duration: Options["duration"],
      easing: Options["easing"],
      complete: Options["complete"]
    ): this;
    toggle(state?: boolean): this;
    animate(
      props: {
        // eslint-disable-next-line functional/prefer-readonly-type
        [prop: string]: number | string;
      },
      options?: Partial<Options>
    ): this;
    animate(
      props: {
        // eslint-disable-next-line functional/prefer-readonly-type
        [prop: string]: number | string;
      },
      duration?: Options["duration"],
      easing?: Options["easing"],
      complete?: () => void
    ): this;
    clearQueue(queueName?: string): this;
    delay(ms: number | string, queueName?: string): this;
    dequeue(queueName?: string): this;

    slideDown(
      duration: Options["duration"],
      complete?: Options["complete"]
    ): this;
    slideDown(options?: Partial<Options>): this;
    slideDown(
      duration: Options["duration"],
      easing: Options["easing"],
      complete: Options["complete"]
    ): this;
    slideUp(
      duration: Options["duration"],
      complete?: Options["complete"]
    ): this;
    slideUp(options?: Partial<Options>): this;
    slideUp(
      duration: Options["duration"],
      easing: Options["easing"],
      complete: Options["complete"]
    ): this;
    slideToggle(
      duration: Options["duration"],
      complete?: Options["complete"]
    ): this;
    slideToggle(options?: Partial<Options>): this;
    slideToggle(
      duration: Options["duration"],
      easing: Options["easing"],
      complete: Options["complete"]
    ): this;
    fadeIn(duration: Options["duration"], complete?: Options["complete"]): this;
    fadeIn(options?: Partial<Options>): this;
    fadeIn(
      duration: Options["duration"],
      easing: Options["easing"],
      complete: Options["complete"]
    ): this;
    fadeOut(
      duration: Options["duration"],
      complete?: Options["complete"]
    ): this;
    fadeOut(options?: Partial<Options>): this;
    fadeOut(
      duration: Options["duration"],
      easing: Options["easing"],
      complete: Options["complete"]
    ): this;
    fadeToggle(
      duration: Options["duration"],
      complete?: Options["complete"]
    ): this;
    fadeToggle(options?: Partial<Options>): this;
    fadeToggle(
      duration: Options["duration"],
      easing: Options["easing"],
      complete: Options["complete"]
    ): this;
    fadeTo(
      duration: Options["duration"],
      opacity: number,
      complete?: Options["complete"]
    ): this;
    fadeTo(
      duration: Options["duration"],
      opacity: number,
      easing?: Options["easing"],
      complete?: Options["complete"]
    ): this;
    finish(queueName?: string): this;
    queue(queueName?: string): SetAnimateQueue;
    queue(callback: FunctionQueue): this;
    queue(queueName: string, callback: FunctionQueue): this;
    stop(clearQueue?: boolean, jumpToEnd?: boolean): this;
    stop(queueName: string, clearQueue?: boolean, jumpToEnd?: boolean): this;
    pause(queueName?: string): this;
    play(queueName?: string): this;
  }
}

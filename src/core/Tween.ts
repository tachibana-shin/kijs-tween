/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getAll as getAllByTweenjs,
  Tween as TweenByTweenjs,
  update as updateByTweenjs,
} from "@tweenjs/tween.js";
import { adjustCSS, css, cssNumber, extend, Kijs } from "kijs";

import isHiddenWithinTree from "../helpers/isHiddenWithinTree";
import showHide, { getDisplayElementInCache } from "../helpers/showHide";
import propHooks from "../hooks/propHooks";
import easings from "../static/easings";
import speeds from "../static/speeds";

type Options<El = any> = {
  readonly duration: keyof typeof speeds | number;
  readonly easing: ((k: number) => number) | string;
  readonly queue?: boolean | string;
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
  readonly then: () => void | PromiseLike<void>;
  readonly catch: () => void | PromiseLike<void>;
  readonly finally: () => void | PromiseLike<void>;

  // eslint-disable-next-line functional/prefer-readonly-type
  onUpdateCbs?: Set<(tween: this) => void>;
  // eslint-disable-next-line functional/prefer-readonly-type
  onStartCbs?: Set<(tween: this) => void>;

  constructor(
    elem: El,
    prop: string,
    value: number | string,
    options: Options<El>
  ) {
    this.elem = elem;
    this.options = options;
    this.prop = prop;

    const adjust = adjustCSS(
      elem,
      prop,
      typeof value === "number" ? value + "px" : value,
      () => this.cur()
    );

    this.start = this.now = adjust.start;
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
    this.tween.onUpdate(({ value }) => {
      this.now = value;
      this.set();

      // call event;
      this.onUpdateCbs?.forEach((cb) => cb(this));
    });
    this.tween.onStart(() => {
      this.onStartCbs?.forEach((cb) => cb(this));
    });

    this.promise = new Promise((resolve, reject) => {
      this.tween.onComplete(() => resolve());
      this.tween.onStop(() => reject());
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
} {
  // eslint-disable-next-line functional/prefer-readonly-type
  const tweens: Tween<any>[] = [];
  const isBox = "width" in props || "height" in props; // is enable overflow
  const isHidden = elem.nodeType && isHiddenWithinTree(elem) === false;
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
          tweens.push(new Tween(elem, prop, valueTo, options));
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
    .finally(() => options.complete?.call(elem))
    .then(() => options.done?.call(elem))
    .catch(() => options.fail?.call(elem))
    .finally(() => options.always?.call(elem));

  // / before start
  // eslint-disable-next-line functional/no-let
  let overflowsBackup: readonly string[] | void;
  if (isBox) {
    // set overflow hidden on start
    tweens[0]?.onStart(() => {
      // backup overflow
      overflowsBackup = [
        elem.style.overflow || "",
        elem.style.overflowX || "",
        elem.style.overflowY || "",
      ];

      // eslint-disable-next-line functional/immutable-data
      elem.style.overflow = "hidden";
      // eslint-disable-next-line functional/immutable-data
      elem.style.overflowX = elem.style.overflowY = "";
    });
    promise.finally(() => {
      if (overflowsBackup) {
        // restore
        [elem.style.overflow, elem.style.overflowX, elem.style.overflowY] =
          overflowsBackup;
        overflowsBackup = void 0;
      }
    });
  }
  // eslint-disable-next-line functional/no-let
  let displayBackup: string | void;
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
      displayBackup = elem.nodeType && getDisplayElementInCache(elem); // never "none"
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
    });
    promise.finally(() => {
      if (isHidden) {
        // eslint-disable-next-line functional/immutable-data
        elem.style.display = displayBackup;
      } else {
        showHide([elem], false);
      }
    });
  }

  if (options.start) {
    tweens[0]?.onStart(() => options.start?.call(elem, promise));
  }

  // startTweens(tweens);

  return { promise, tweens };
}
function startTweens(
  tweens: ReturnType<typeof createTweensByProps>["tweens"]
): void {
  tweens?.forEach((tween) => tween.tween.start());

  update();
}

const storeWeakAnimate = new WeakMap<
  any,
  // eslint-disable-next-line functional/prefer-readonly-type
  Map<
    string,
    // eslint-disable-next-line functional/prefer-readonly-type
    Set<
      | {
          readonly props: Record<string, string | number>;
          readonly options: Options<any>;
        }
      | (() => void | Promise<void>)
    >
  >
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
function startTweenQueueInStore(elem: any, queueName: string): void {
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

      const tweenProps =
        typeof argTween === "function"
          ? { promise: argTween() || Promise.resolve() }
          : createTweensByProps(elem, argTween.props, argTween.options);
          
      // hydration complete -> remove argTwen in task
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      storeWeakAnimate.get(elem)!.get(queueName)!.delete(argTween);

      initWeakTweenPropsRunning(elem);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      storeWeakTweenPropsRunning.get(elem)!.add(tweenProps);

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
  Ki.prototype.delay = function (ms: number, queueName = "fx") {
    this.each((elem) => {
      if (typeof elem !== "object" && typeof elem !== "function") {
        return void 0xa;
      }

      initWeakAnimate(elem, queueName);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      storeWeakAnimate
        .get(elem)!
        .get(queueName)!
        .add(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    });

    return this;
  };
}

export type { Options };
export default Tween;
export { installer };

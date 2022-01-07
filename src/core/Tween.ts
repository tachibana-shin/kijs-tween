import {
  Tween as TweenByTweenjs,
  update as updateByTweenjs,
  getAll as getAllByTweenjs,
  Easing,
} from "@tweenjs/tween.js";

type ValueOrArray<T> = T | T[];
type Options<El> = {
  duration: keyof speeds | number = "_default";
  easing: ((k: number) => number) | keyof easings;
  queue?: boolean | string;
  specialEasing?: {
    [prop: keyof Props]: ((k: number) => number) | string;
  };
  step?: (this: El, now: number, tween: Tween) => void;
  progress?: (this: El, animation: Promise<void>, remainingMs: number) => void;
  complete?: (this: El) => void;
  start?: (this: El, animation: Promise) => void;

  done?: () => void;
  fail?: () => void;
  always?: () => void;
};

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
class Tween<El extends any> extends TweenByTweenjs {
  readonly elem: HTMLElement;
  readonly units: Record<keyof Props, string>;
  readonly start: number;
  readonly end: number;
  readonly unit: string;
  readonly options: Options<El>;
  now: number;
  readonly prop: string;
  readonly promise: Promise<void>;

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

    this.start = adjust.start;
    this.end = adjust.end;
    this.unit = adjust.unit || (cssNumber[prop] ? "" : "px");

    let { duration } = options;
    if (typeof duration === "string") {
      duration = speeds[duration];
    }

    super({
      value: this.start,
    });
    this.to(
      {
        value: this.end,
      },
      duration
    );

    const easing = options.specialEasing[prop] || options.easing;
    this.easing(typeof easing === "string" ? easings[easing] : easing);
    this.onUpdate(({ value }) => {
      this.now = value;
      this.set();
    });

    this.promise = new Promise((res, rej) => {
      this.onComplete(() => resolve());
      this.onStop(() => reject());
    });
    this.then = this.promise.then.bind(this.promise);
    this.catch = this.promise.catch.bind(this.promise);
    this.finally = this.promise.finally.bind(this.promise);

    // call if is not of queue this.start();
  }

  cur(prop: string) {
    return (propHooks.get(prop)?.get || propHooks.get("_default").get)!(this);
  }
  set(prop: string, value: number) {
    this.options.step?.call(this.elem, this.now, this);

    (propHopks.get(prop)?.set || propHooks.get("_default").set)!(this);
  }
}

const rfxtypes = /^(?:toggle|show|hide)$/;
function createTweensByProps(
  el: any,
  props: {
    [key: string]: number | string;
  },
  options: Options
): {
  promise: Promise<void>;
  tweens: Tween[];
} {
  const tweens = [];
  const isBox = "width" in props || "height" in props; // is enable overflow
  const isHidden = elem.nodeType && isHiddenWithinTree(elem) === false;
  let enableModeFx = false; // is enable display
  const valueStylesBackup: typeof props = {};

  for (const prop in props) {
    if (rfxtypes.exec(props[prop])) {
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
        valueStylesBackup[prop] = elem.style[prop] || "";
        const valueTo = css(elem, prop); // get style of me
        tweens.push(new Tween(elem, prop, valueTo, options));
      } else {
        valueStylesBackup[prop] = elem.style[prop] || "";

        tweens.push(new Tween(elem, prop, 0, options));
      }
    }

    tweens.push(new Tween(elem, prop, options, props[prop]));
  }

  if (options.progress) {
    tweens[0]?.onProgress((tween) => {
      options.progress?.call(
        el,
        tween.now / tween.end,
        tween.duration() * (1 - tween.now / tween.end)
      );
    });
  }

  // / before start
  let overflowsBackup;
  if (isBox) {
    // set overflow hidden on start
    tweens[0]?.onStart(() => {
      // backup overflow
      overflowsBackup = [
        elem.style.overflow || "",
        elem.style.overflowX || "",
        elem.style.overflowY || "",
      ];

      elem.style.overflow = "hidden";
      elem.style.overflowX = elem.style.overflowY = "";
    });
    promise.finally(() => {
      // restore
      [elem.style.overflow, elem.style.overflowX, elem.style.overflowY] =
        overflowsBackup;
      overflowsBackup = void 0;
    });
  }
  let displayBackup;
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
      displayBackup = getDisplayElementInCache(); // never "none"
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
        elem.style.display = "inline-block";
      }

      showHide([elem], true);
    });
    promise.finally(() => {
      if (isHidden) {
        elem.style.display = displayBackup;
      } else {
        showHide([elem], false);
      }
    });
  }
  const promise = Promise.all(tweens)
    .finally(() => options.complete.call(el))
    .then(() => options.done.call(el))
    .catch(() => options.fail.call(el))
    .finally(() => options.always.call(el));

  if (options.start) {
    tweens[0]?.onStart((tween) => options.start?.call(elem, tweens[0]));
  }

  // startTweens(tweens);

  return { promise, tweens };
}
function startTweens(
  tweens: ReturnType<typeof createTweensByProps>["tweens"]
): void {
  tweens.forEach((tween) => tween.start());

  update();
}

const storeWeakAnimate = new WeakMap<
  any,
  Map<string, Set<Props | (() => void | Promise<void>)>>
>();
const storeWeakTweenPropsRunning = new WeakMap<
  any,
  Set<ReturnType<typeof createTweensByProps>>
>();

function initWeakAnimate(elem: any, queueName: string): void {
  if (storeWeakAnimate.has(elem) === false) {
    storeWeakAnimate.set(elem, new Map());
  }
  if (storeWeakAnimate.get(elem)!.has(queueName) === false) {
    storeWeakAnimate.get(elem)!.set(queueName, new Set());
  }
}
function initWeakTweenPropsRunning(elem: any) {
  if (storeWeakTweenPropsRunning.has(elem) === false) {
    storeWeakTweenPropsRunning.set(elem, new Set());
  }
}
function startTweenQueueInStore(elem: any, queueName: string): void {
  if (storeWeakAnimate.get(elem)!.get(queueName)!.size > 0) {
    /* if (storeWeakTweenPropsRunning.has(elem)) {
      // call fs
    } else */ {
      const props = storeWeakAnimate
        .get(elem)!
        .get(queueName)!
        .values()
        .next().value;

      const tweenProps =
        typeof props === "function"
          ? { promise: props() }
          : createTweensByProps(elem, props);

      initWeakTweenPropsRunning(elem);

      storeWeakTweenPropsRunning.get(elem)!.add(tweenProps);

      tweenProps.promise.finally(() => {
        // call next
        // delete now
        storeWeakTweenPropsRunning.get(elem)!.delete(tweenProps);

        // clear cache
        if (storeWeakTweenPropsRunning.get(elem)?.size < 1) {
          storeWeakTweenPropsRunning.delete(elem);
        }

        // call next;
        startTweenQueueInStore(elem, queueName);
      });

      startTweens(tweenProps.props);
    }
    // start it -->
  }
}

Kijs.prototype.animate = function (props, duration, easing, complete) {
  const options = extend(
    {
      duration: "_default",
      easing: "_default",
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

      storeWeakAnimate.get(elem)!.get(queueName)!.add(props);

      startTweenQueueInStore(elem, queueName);
    });
  } else {
    // if options.queue == false: <-- no save to store
    this.each((elem) => {
      if (typeof elem !== "object" && typeof elem !== "function") {
        return void 0xa;
      }

      const tweenProps = createTweensByProps(elem, props);

      initWeakTweenPropsRunning(elem);

      storeWeakTweenPropsRunning.get(elem)!.add(tweenProps);

      startTweens(tweenProps.tweens);
    });
  }
};
Kijs.prototype.delay = function (ms: number) {
  this.each((elem) => {
    if (typeof elem !== "object" && typeof elem !== "function") {
      return void 0xa;
    }

    initWeakAnimate(elem, queueName);

    storeWeakAnimate
      .get(elem)!
      .get(queueName)!
      .add(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  });
};

export type { Options };
export default Tween;

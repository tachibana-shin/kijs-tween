import { Kijs } from "kijs";

import "./core/Tween";
import Tween, { installer, Options } from "./core/Tween";
import isHiddenWithinTree from "./helpers/isHiddenWithinTree";
import showHide from "./helpers/showHide";
import easings from "./static/easings";
import speeds from "./static/speeds";
import steps from "./static/steps";

export { isHiddenWithinTree, showHide, Tween, easings, speeds, steps };
export type { Options };

declare module "kijs" {
  class Kijs {
    show(): this;
    hide(): this;
    toggle(state?: boolean): this;
    animate(
      props: {
        // eslint-disable-next-line functional/prefer-readonly-type
        [prop: string]: number | string;
      },
      options?: Options
    ): this;
    animate(
      props: {
        // eslint-disable-next-line functional/prefer-readonly-type
        [prop: string]: number | string;
      },
      duration?: number | string,
      easing?: string | ((k: number) => number),
      complete?: () => void
    ): this;
    delay(ms: number): this;
  }
}

export default function (Ki: typeof Kijs) {
  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.show = function () {
    showHide(this, true);

    return this;
  };
  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.hide = function () {
    showHide(this, false);

    return this;
  };
  // eslint-disable-next-line functional/immutable-data
  Ki.prototype.toggle = function (state) {
    if (state !== void 0) {
      return state ? this.show() : this.hide();
    }

    return this.each((elem) => {
      if (isHiddenWithinTree(elem)) {
        showHide([elem], true);
      } else {
        showHide([elem], false);
      }
    });
  };

  installer(Ki);
}

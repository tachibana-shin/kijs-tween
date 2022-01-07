import "./core/Tween";

export { isHiddenWithinTree, showHide };

declare module "kijs" {
  class Kijs {
    show(): this;
    hide(): thtis;
    toggle(state?: boolean): this;
    animate(
      props: {
        [prop: string]: number | string;
      },
      options?: Options
    ): this;
    animate(
      props: {
        [prop: string]: number | string;
      },
      duration?: number | string,
      easing?: string | ((k: number) => number),
      complete?: () => void
    ): this;
    delay(ms: number): this;
  }
}

Kijs.prototype.show = function () {
  showHide(this, true);

  return this;
};
Kijs.prototype.hide = function () {
  showHide(this, false);

  return this;
};
Kijs.prototype.toggle = function (state) {
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

  return this;
};

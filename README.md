# kijs-tween

Add animate for kijs

```ts
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
```

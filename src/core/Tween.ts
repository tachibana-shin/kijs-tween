import { Tween as TweenByTweenjs } from "@tweenjs/tween"

type ValueOrArray<T> = T | T[];

class Tween<Props extends {
  [name: string]: ValueOrArray<string | number>
}> extends TweenByTweenjs {
  constructor(props: Props) {
    
  }
}
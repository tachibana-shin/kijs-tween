import { each } from "kijs";

import getDefaultDisplay from "./getDefaultDisplay";
import isHiddenWithinTree from "./isHiddenWithinTree";

const cacheDisplayElement = new Map<HTMLElement, string>();

export function getDisplayElementInCache(elem: HTMLElement): string | void {
  return cacheDisplayElement.get(elem);
}

export default function showHide(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: ArrayLike<any>,
  show = false
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): ArrayLike<any> {
  // eslint-disable-next-line functional/prefer-readonly-type
  const values: (string | void)[] = [];
  // scan values
  each(elements, (elem, index) => {
    if (!elem || !elem.style) {
      return 0;
    }

    const display = elem.style.display;

    if (show) {
      if (display === "none") {
        // eslint-disable-next-line functional/immutable-data
        values[index] = cacheDisplayElement.get(elem) || void 0;

        if (!values[index]) {
          // eslint-disable-next-line functional/immutable-data
          elem.style.display = "";
        }

        if (elem.style.display === "" && isHiddenWithinTree(elem)) {
          // eslint-disable-next-line functional/immutable-data
          values[index] = getDefaultDisplay(elem);
        }
      }
    } else {
      if (display !== "none") {
        // eslint-disable-next-line functional/immutable-data
        values[index] = "none";
        cacheDisplayElement.set(elem, display);
      }
    }
  });

  // set values, not merge
  each(elements, (elem, index) => {
    if (values[index] !== void 0) {
      // eslint-disable-next-line functional/immutable-data
      elem.style.display = values[index];
    }
  });
  return elements;
}

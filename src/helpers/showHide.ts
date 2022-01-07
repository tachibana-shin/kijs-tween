const cacheDisplayElement = new Map<HTMLElement, string>();

export function getDisplayElementInCache(elem: HTMLElement): string | void {
  return cacheDisplayElement.get(elem);
}

export default function showHide<T>(
  elements: LikeArray<T>,
  show = false
): LikeArray<T> {
  const values: (string | void)[] = [];
  // scan values
  each(elements, (elem, index) => {
    if (!elem || !elem.style) {
      return 0;
    }

    const display = elem.style.display;

    if (show) {
      if (display === "none") {
        values[index] = cacheDisplayElement.get(elem) || void 0;

        if (!values[index]) {
          elem.style.display = "";
        }

        if (elem.style.display === "" && isHiddenWithinTree(elem)) {
          values[index] = getDefaultDisplay(elem);
        }
      }
    } else {
      if (display !== "none") {
        values[index] = "none";
        cacheDisplayElement.set(elem, display);
      }
    }
  });

  // set values, not merge
  each(elements, (elem, index) => {
    if (values[index] !== void 0) {
      elem.style.display = values[index];
    }
  });
  return elements;
}

export default function isHiddenWithinTree(elem: HTMLElement): boolean {
  // return true if style == "none" or element is exists in DOM and computedStyle.display == "none"
  return (
    elem.style.display === "none" ||
    (elem.style.display === "" &&
      document.documentElement.contains(elem) &&
      css(elem, "display") === "none")
  );
}

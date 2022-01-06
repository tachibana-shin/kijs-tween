const cacheDefaultDisplay = new Map<string, string>();

export default function getDefaultDisplay(elem: HTMLElement): string {
  if (cacheDefaultDisplay.has(elem.nodeName)) {
    return cacheDefaultDisplay.get(elem.nodeName)!
  }
  
  // create new element, get and rm
  const temp = elem.ownerDocument.body.appendChild(document.createElement(elem.nodeName))
  
  let d = css(temp, "display")
  
  temp.parentNode.removeChild(temp);
  
  if (d === "none") {
    d = "block" // ignore: meta, script, style, link
  }
  
  cacheDefaultDisplay.set(elem.nodeName, d)
  
  return d;
}
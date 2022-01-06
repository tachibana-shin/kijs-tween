export { isHiddenWithinTree, showHide }

Kijs.prototype.extend({
  show() {
    showHide(this, true)
    
    return this
  },
  hide() {
    showHide(this, false)
    
    return this
  },
  toggle(state?: boolean) {
    if (state !== void 0) {
      return state ? this.show() : this.hide()
    }
    
    return this.each(elem => {
      if (isHiddenWithinTree(elem)) {
        showHide([elem], true)
      } else {
        showHide([elem], false)
      }
    })
  }
})

/**
 * if d == "inline":
 *  if float == "none";
 *    style.display = "inline-block"
 * */
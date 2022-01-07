const easing = {
  linear: p => p,
  swing: (p) => 0.5 - Math.cos(p * Math.PI) / 2,
  _default: easing.swing
}

export default easing;
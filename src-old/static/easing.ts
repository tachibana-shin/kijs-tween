const easing = new Map<string, string | ((value: number) => number)>();

easing.set("linear", (p) => p);
easing.set("swing", (p) => 0.5 - Math.cos(p * Math.PI) / 2);
easing.set("_default", "swing");

export default easing;

const easings = new Map<string, (k: number) => number>();

easings.set("linear", (p) => p);
easings.set("swing", (p) => 0.5 - Math.cos(p * Math.PI) / 2);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
easings.set("_default", easings.get("swing")!);

export default easings;

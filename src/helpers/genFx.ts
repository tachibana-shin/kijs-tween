const cssExpand = ["Top", "Right", "Bottom", "Left"];

export default function genFx(type: string | number, includeWidth?: boolean) {
  const attrs: {
    // eslint-disable-next-line functional/prefer-readonly-type
    [prop: string]: string | number;
  } = { height: type };

  // eslint-disable-next-line functional/no-loop-statement, functional/no-let
  for (let i = 0; i < 4; i += 2 - (includeWidth ? 1 : 0)) {
    const which = cssExpand[i];
    // eslint-disable-next-line functional/immutable-data
    attrs["margin" + which] = attrs["padding" + which] = type;
  }

  if (includeWidth) {
    // eslint-disable-next-line functional/immutable-data
    attrs.opacity = attrs.width = type;
  }

  return attrs;
}

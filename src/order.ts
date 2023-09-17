import { UnknownObject } from "./index.js";

export default function order(
  o: UnknownObject | unknown[],
): UnknownObject | unknown[] {
  if (typeof o !== "object" || o === null) {
    return o;
  }

  if (Array.isArray(o)) {
    return o.map((v) => order(v as UnknownObject));
  }

  // get the keys in lexigraphic order, that is default Array#sort behaviour
  const ks = Object.keys(o).sort();

  return ks.reduce((n: UnknownObject, k: string) => {
    n[k] = order(o[k] as UnknownObject);
    return n;
  }, {});
}

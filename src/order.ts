import { UnknownObject } from './index';

export default function order(o: UnknownObject): UnknownObject {
    if (typeof o !== 'object' || o === null || Array.isArray(o)) {
        return o;
    }

    // get the keys in lexigraphic order
    const ks = Object.keys(o).sort((a, b) => a > b ? 1 : -1);

    return ks.reduce((n: UnknownObject, k: string) => {
        n[k] = order(o[k] as UnknownObject);
        return n;
    }, {});
}

import { createHash, createHmac, Hmac } from 'crypto';
import { Order, UnknownObject, defaults } from './index';

interface GenerateOptions {
    order?: Order
}

function transformBody(body: UnknownObject | unknown[], order?: Order): UnknownObject | unknown[] {
    // we never want to order an array as it is deterministic in JSON
    if (Array.isArray(body) || typeof order !== 'function') {
        return body;
    }

    return order(body);
}

function hashBody(body: UnknownObject | unknown[], order?: Order): string {
    const hash = createHash('md5');
    const jsonBody = JSON.stringify(transformBody(body, order));
    hash.update(jsonBody);
    return hash.digest('hex');
}

export default function generate(
    secret: string,
    algorithm: string = defaults.algorithm,
    unix: string | number,
    method: string,
    url: string,
    body?: UnknownObject | unknown[],
    options?: GenerateOptions
): Hmac {
    const hmac = createHmac(algorithm, secret);

    hmac.update(typeof unix === 'number' ? unix.toString() : unix);
    hmac.update(method);
    hmac.update(url);

    if (typeof body === 'object' && body !== null) {
        hmac.update(hashBody(body, options?.order));
    }

    return hmac;
}
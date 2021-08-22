import crypto from 'crypto';
import { Request, RequestHandler, NextFunction } from 'express';

import stringToBuffer from './stringToBuffer';
import validateArguments from './validateArguments';
import AuthError from './errors';

export { AuthError };

export interface Options {
    algorithm: string;
    identifier: string;
    header: string;
    maxInterval: number;
    minInterval: number;
}

export type DynamicSecret = string | ((req: Request) => string | undefined) | ((req: Request) => Promise<string|undefined>);

const dynamicSecretErr = (secret: unknown): AuthError => new AuthError(`Invalid secret. Expected non-empty string but got '${secret}' (type: ${typeof secret})`);

const defaults: Options = {
    algorithm: 'sha256',
    identifier: 'HMAC',
    header: 'authorization',
    maxInterval: 60 * 5,
    minInterval: 0 
}

export function generate(secret: string, algorithm: string = defaults.algorithm, unix: string | number, method: string, url: string, body?: Record<string, unknown> | unknown[]): crypto.Hmac {
    const hmac = crypto.createHmac(algorithm, secret);

    hmac.update(typeof unix === 'number' ? unix.toString() : unix);
    hmac.update(method);
    hmac.update(url);

    // if we have a body, create a md5 hash of it and add it to the hmac
    if (typeof body === 'object' && body !== null) {
        const hash = crypto.createHash('md5');
        hash.update(JSON.stringify(body));
        hmac.update(hash.digest('hex'));
    }

    return hmac;
}

export function HMAC(secret: DynamicSecret, options: Partial<Options> = {}): RequestHandler {
    const mergedOpts: Options = { ...defaults, ...options };

    validateArguments(secret, mergedOpts);

    return async function(request: Request, _, next: NextFunction): Promise<void> {
        // we have to create a scoped secret per request, if we were to reassign the original `secret` variable
        // the next request that comes in will no longer be the secret function
        // this means we have to explicitly check it's not undefined too
        let scopedSecret: string;
        if (typeof secret === 'function') {
            // this function may or may not be async, so await it regardless
            const dynamicSecret = await secret(request);
            if (typeof dynamicSecret !== 'string' || dynamicSecret.length === 0) {
                return next(dynamicSecretErr(dynamicSecret));
            }

            scopedSecret = dynamicSecret;
        } else if (typeof secret === 'string' && secret.length > 0) {
            scopedSecret = secret;
        } else {
            return next(dynamicSecretErr(secret));
        }

        const header = request.get(mergedOpts.header);
        if (typeof header !== 'string') {
            return next(new AuthError(`Header provided not in sent headers. Expected ${mergedOpts.header} but not found in request.headers`));
        }

        if (typeof mergedOpts.identifier !== 'string' || !header.startsWith(mergedOpts.identifier)) {
            return next(new AuthError(`Header did not start with correct identifier. Expected ${mergedOpts.identifier} but not found in options.header`));
        }

        const unixRegex = /(\d{1,13}):/;
        const unixMatch = unixRegex.exec(header);
        if (!Array.isArray(unixMatch) || unixMatch.length !== 2 || typeof unixMatch[1] !== 'string') {
            return next(new AuthError('Unix timestamp was not present in header'));
        }

        // is the unix timestamp difference to current timestamp larger than maxInterval or smaller than minInterval
        const timeDiff = Math.floor(Date.now() / 1000) - Math.floor(parseInt(unixMatch[1], 10) / 1000);
        if (timeDiff > mergedOpts.maxInterval || (timeDiff * -1) > mergedOpts.minInterval) {
            return next(new AuthError('Time difference between generated and requested time is too great'));
        }

        // check HMAC digest exists in header
        const hashRegex = /:(.{1,}$)/;
        const hashMatch = hashRegex.exec(header);
        if (!Array.isArray(hashMatch) || hashMatch.length !== 2 || typeof hashMatch[1] !== 'string') {
            return next(new AuthError('HMAC digest was not present in header'));
        }

        const hmac = generate(scopedSecret, mergedOpts.algorithm, unixMatch[1], request.method, request.originalUrl, request.body).digest();
        const sourceDigest = stringToBuffer(hashMatch[1]); // convert string to buffer

        // use timing safe check to prevent timing attacks
        if (hmac.length !== sourceDigest.length || !crypto.timingSafeEqual(hmac, sourceDigest)) {
            return next(new AuthError('HMAC\'s did not match'));
        }

        return next();
    }
}
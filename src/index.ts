import crypto from 'crypto';
import { Request, RequestHandler, NextFunction } from 'express';

import stringToBuffer from './stringToBuffer';
import validateArguments from './validateArguments';
import AuthError from './errors';
import generate from './generate';
import order from './order';

export { AuthError, generate, order };

export type UnknownObject = Record<string, unknown>;
export type DynamicSecret = string | ((req: Request) => string | undefined) | ((req: Request) => Promise<string|undefined>);
export type Order = (o: UnknownObject) => UnknownObject;

export interface Options {
    algorithm: string;
    identifier: string;
    header: string;
    maxInterval: number;
    minInterval: number;
    order?: Order
}

export const defaults: Options = {
    algorithm: 'sha256',
    identifier: 'HMAC',
    header: 'authorization',
    maxInterval: 60 * 5,
    minInterval: 0
}

async function determineSecret(secret: DynamicSecret, req: Request): Promise<string | undefined> {
    return typeof secret === 'function' ? await secret(req) : secret;
}

export function HMAC(secret: DynamicSecret, options: Partial<Options> = {}): RequestHandler {
    const mergedOpts: Options = { ...defaults, ...options };

    validateArguments(secret, mergedOpts);

    return async function(request: Request, _, next: NextFunction): Promise<void> {
        // we have to create a scoped secret per request, if we were to reassign the original `secret` variable
        // the next request that comes in will no longer be the secret function
        // this means we have to explicitly check it's not undefined too
        const scopedSecret = await determineSecret(secret, request);
        if (typeof scopedSecret !== 'string' || scopedSecret.length === 0) {
            return next(new AuthError(`Invalid secret. Expected non-empty string but got '${scopedSecret}' (type: ${typeof scopedSecret})`));
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

        const hmac = generate(scopedSecret, mergedOpts.algorithm, unixMatch[1], request.method, request.originalUrl, request.body, { order: mergedOpts.order }).digest();
        const sourceDigest = stringToBuffer(hashMatch[1]); // convert string to buffer

        // use timing safe check to prevent timing attacks
        if (hmac.length !== sourceDigest.length || !crypto.timingSafeEqual(hmac, sourceDigest)) {
            return next(new AuthError('HMAC\'s did not match'));
        }

        return next();
    }
}
import crypto from 'crypto';

import { Options } from './index';

export default function(secret: string, options: Options): void {
    if (!secret || typeof secret !== 'string') {
        throw new TypeError(`Invalid value provided for property secret. Expected non-empty string but got '${secret}' (type: ${typeof secret})`);
    }

    if (typeof options.algorithm !== 'string' || !crypto.getHashes().includes(options.algorithm)) {
        throw new TypeError(`Invalid value provided for property options.algorithm. Expected value from crypto.getHashes() but got ${options.algorithm} (type: ${typeof options.algorithm})`);
    }

    if (!options.identifier || typeof options.identifier !== 'string') {
        throw new TypeError(`Invalid value provided for property options.identifier. Expected non-empty string but got '${options.identifier}' (type: ${typeof options.identifier})`);
    }

    if (!options.header || typeof options.header !== 'string') {
        throw new TypeError(`Invalid value provided for property options.header. Expected non-empty string but got '${options.header}' (type: ${typeof options.header})`);
    }

    if (!options.maxInterval || typeof options.maxInterval !== 'number' || Number.isNaN(options.maxInterval)) {
        throw new TypeError(`Invalid value provided for property options.maxInterval. Expected number but got '${options.maxInterval}' (type: ${typeof options.maxInterval})`);
    }

    if (typeof options.minInterval !== 'number' || Number.isNaN(options.minInterval) || options.minInterval < 0) {
        throw new TypeError(`Invalid value provided for optional property options.minInterval. Expected positive number but got '${options.minInterval}' (type: ${typeof options.minInterval})`);
    }
}
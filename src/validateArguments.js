const crypto = require('crypto');

module.exports = function(secret, options) {
    if (!secret || typeof secret !== 'string') {
        return new TypeError(`Invalid value provided for property secret. Expected non-empty string but got '${secret}' (type: ${typeof secret})`);
    }

    if (!crypto.getHashes().includes(options.algorithm)) {
        return new TypeError(`Invalid value provided for property options.algorithm. Expected value from crypto.getHashes() but got ${options.algorithm}`);
    }

    if (!options.identifier || typeof options.identifier !== 'string') {
        return new TypeError(`Invalid value provided for property options.identifier. Expected non-empty string but got '${options.identifier}' (type: ${typeof options.identifier})`);
    }

    if (!options.header || typeof options.header !== 'string') {
        return new TypeError(`Invalid value provided for property options.header. Expected non-empty string but got '${options.header}' (type: ${typeof options.header})`);
    }

    if (!options.maxInterval || typeof options.maxInterval !== 'number' || Number.isNaN(options.maxInterval)) {
        return new TypeError(`Invalid value provided for property options.maxInterval. Expected number but got '${options.maxInterval}' (type: ${typeof options.maxInterval})`);
    }

    if (options.error === undefined || !(options.error === false || typeof options.error === 'string')) {
        return new TypeError(`Invalid value provided for property options.error. Expected non-empty string or false but got '${options.error}' (type: ${typeof options.error})`);
    }
}
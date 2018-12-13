const crypto = require('crypto');
const stringToBuffer = require('./stringToBuffer');

module.exports = function(secret, options = {}) {
    options.algorithm = options.algorithm || 'sha256';
    options.identifier = options.identifier || 'HMAC';
    options.header = options.header || 'authentication';
    options.maxInterval = options.maxInterval || 60 * 5;
    options.error = options.error || 'Invalid request';

    if (!secret || typeof secret !== 'string') {
        throw new TypeError(`Invalid value provided for property secret. Expected non-empty string but got '${secret}' (type: ${typeof secret})`);
    }

    if (!crypto.getHashes().includes(options.algorithm)) {
        throw new TypeError(`Invalid value provided for property options.algorithm. Expected value from crypto.getHashes() but got ${options.algorithm}`);
    }

    if (!options.identifier || typeof options.identifier !== 'string') {
        throw new TypeError(`Invalid value provided for property options.identifier. Expected non-empty string but got '${options.identifier}' (type: ${typeof options.identifier})`);
    }

    if (!options.header || typeof options.header !== 'string') {
        throw new TypeError(`Invalid value provided for property options.header. Expected non-empty string but got '${options.header}' (type: ${typeof options.header})`);
    }

    return function(request, response, next) {
        const hmac = crypto.createHmac(options.algorithm, secret);

        if (!(options.header in request.headers)) {
            console.error(`Header provided not in sent headers. Expected ${options.header} but not found in request.headers`);
            return response.status(401).send(options.error);
        }

        if (!request.headers[options.header].startsWith(options.identifier)) {
            console.error(`Header did not start with correct identifier. Expected ${options.identifier} but not found in options.header`);
            return response.status(401).send(options.error);
        }

        const unixRegex = /(\d{1,10}):/;
        const unixMatch = unixRegex.exec(request.headers[options.header]);
        if (!unixMatch || unixMatch.length !== 2) {
            console.error('Unix timestamp was not present in header');
            return response.status(401).send(options.error);
        }

        const timeDiff = Math.floor(Date.now() / 1000) - parseInt(unixMatch[1]);
        if (timeDiff > options.maxInterval || timeDiff < 0) {
            console.error('Time difference between generated and requested time is too great');
            return response.status(401).send(options.error);
        }

        const hashRegex = /:(.*$)/;
        const hashMatch = hashRegex.exec(request.headers[options.header]);
        if (hashMatch.length !== 2) {
            console.error('HMAC digest was not present in header');
            return response.status(401).send(options.error);
        }

        hmac.update(request.method);
        hmac.update(request.baseUrl);

        if (Object.keys(request.body).length) {
            const hash = crypto.createHash('md5');
            hash.update(JSON.stringify(request.body));
            hmac.update(hash.digest('hex'));
        }

        const hmacDigest = hmac.digest();
        const sourceDigest = stringToBuffer(hashMatch[1]);
        if (hmacDigest.length !== sourceDigest.length || !crypto.timingSafeEqual(hmacDigest, sourceDigest)) {
            console.error('HMAC\'s did not match');
            return response.status(401).send(options.error);
        }

        return next();
    }
}
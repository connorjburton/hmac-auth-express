const crypto = require('crypto');
const stringToBuffer = require('./stringToBuffer');
const validateArguments = require('./validateArguments');
const { HMACAuthError } = require('./errors');

module.exports = function(secret, options = {}) {
    options.algorithm = options.algorithm || 'sha256';
    options.identifier = options.identifier || 'HMAC';
    options.header = options.header || 'authentication';
    options.maxInterval = options.maxInterval || 60 * 5;
    options.minInterval = options.minInterval || 0;

    const error = validateArguments(secret, options);
    if (error) {
        throw error;
    }

    return function(request, response, next) {
        const hmac = crypto.createHmac(options.algorithm, secret);

        // checked the header we specified exists in request headers
        if (!(options.header in request.headers)) {
            return next(new HMACAuthError(`Header provided not in sent headers. Expected ${options.header} but not found in request.headers`));
        }

        // check the header we specified has the identifier we specified
        if (!request.headers[options.header].startsWith(options.identifier)) {
            return next(new HMACAuthError(`Header did not start with correct identifier. Expected ${options.identifier} but not found in options.header`));
        }

        // is the unix timestamp present in the header
        const unixRegex = /(\d{1,13}):/;
        const unixMatch = unixRegex.exec(request.headers[options.header]);
        if (!unixMatch || unixMatch.length !== 2) {
            return next(new HMACAuthError('Unix timestamp was not present in header'));
        }

        // is the unix timestamp difference to current timestamp larger than maxInterval
        const timeDiff = Math.floor(Date.now() / 1000) - Math.floor(parseInt(unixMatch[1], 10) / 1000);
        if (timeDiff > options.maxInterval || timeDiff < options.minInterval) {
            return next(new HMACAuthError('Time difference between generated and requested time is too great'));
        }

        // check HMAC digest exists in header
        const hashRegex = /:(.{1,}$)/;
        const hashMatch = hashRegex.exec(request.headers[options.header]);
        if (!Array.isArray(hashMatch)) {
            return next(new HMACAuthError('HMAC digest was not present in header'));
        }

        hmac.update(unixMatch[1]); // add timestamp provided in header to make sure it hasn't been changed
        hmac.update(request.method); // add verb e.g POST, GET
        hmac.update(request.originalUrl); // add url e.g /api/order

        // if we have a request body, create a md5 hash of it and add it to the hmac
        if (typeof request.body === 'object' && !Array.isArray(request.body) && Object.keys(request.body).length) {
            const hash = crypto.createHash('md5');
            hash.update(JSON.stringify(request.body)); // we add it as a json string
            hmac.update(hash.digest('hex'));
        }

        const hmacDigest = hmac.digest(); // returns Uint8Array buffer
        const sourceDigest = stringToBuffer(hashMatch[1]); // convert string to buffer

        // use timing safe check to prevent timing attacks
        if (hmacDigest.length !== sourceDigest.length || !crypto.timingSafeEqual(hmacDigest, sourceDigest)) {
            return next(new HMACAuthError('HMAC\'s did not match'));
        }

        return next();
    }
}
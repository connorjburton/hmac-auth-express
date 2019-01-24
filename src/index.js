const crypto = require('crypto');
const stringToBuffer = require('./stringToBuffer');
const validateArguments = require('./validateArguments');

module.exports = function(secret, options = {}) {
    options.algorithm = options.algorithm || 'sha256';
    options.identifier = options.identifier || 'HMAC';
    options.header = options.header || 'authentication';
    options.maxInterval = options.maxInterval || 60 * 5;
    options.error = options.error || 'Invalid request';

    const error = validateArguments(secret, options);
    if (error) {
        throw error;
    }

    return function(request, response, next) {
        const hmac = crypto.createHmac(options.algorithm, secret);

        // checked the header we specified exists in request headers
        if (!(options.header in request.headers)) {
            console.error(`Header provided not in sent headers. Expected ${options.header} but not found in request.headers`);
            return response.status(401).send(options.error);
        }

        // check the header we specified has the identifier we specified
        if (!request.headers[options.header].startsWith(options.identifier)) {
            console.error(`Header did not start with correct identifier. Expected ${options.identifier} but not found in options.header`);
            return response.status(401).send(options.error);
        }

        // is the unix timestamp present in the header
        const unixRegex = /(\d{1,10}):/;
        const unixMatch = unixRegex.exec(request.headers[options.header]);
        if (!unixMatch || unixMatch.length !== 2) {
            console.error('Unix timestamp was not present in header');
            return response.status(401).send(options.error);
        }

        // is the unix timestamp difference to current timestamp larger than maxInterval
        const timeDiff = Math.floor(Date.now() / 1000) - parseInt(unixMatch[1]);
        if (timeDiff > options.maxInterval || timeDiff < 0) {
            console.error('Time difference between generated and requested time is too great');
            return response.status(401).send(options.error);
        }

        // check HMAC digest exists in header
        const hashRegex = /:(.*$)/;
        const hashMatch = hashRegex.exec(request.headers[options.header]);
        if (hashMatch.length !== 2) {
            console.error('HMAC digest was not present in header');
            return response.status(401).send(options.error);
        }

        hmac.update(unixMatch[1]); // add timestamp provided in header to make sure it hasn't been changed
        hmac.update(request.method); // add verb e.g POST, GET
        hmac.update(request.originalUrl); // add url e.g /api/order

        // if we have a request body, create a md5 hash of it and add it to the hmac
        if (Object.keys(request.body).length) {
            const hash = crypto.createHash('md5');
            hash.update(JSON.stringify(request.body)); // we add it as a json string
            hmac.update(hash.digest('hex'));
        }

        const hmacDigest = hmac.digest(); // returns Uint8Array buffer
        const sourceDigest = stringToBuffer(hashMatch[1]); // convert string to buffer

        // use timing safe check to prevent timing attacks
        if (hmacDigest.length !== sourceDigest.length || !crypto.timingSafeEqual(hmacDigest, sourceDigest)) {
            console.error('HMAC\'s did not match');
            return response.status(401).send(options.error);
        }

        return next();
    }
}
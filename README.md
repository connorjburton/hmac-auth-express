# HMAC Auth Express

[![npm](https://img.shields.io/npm/v/hmac-auth-express)](https://www.npmjs.com/package/hmac-auth-express)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/connorjburton/hmac-auth-express/Node.js%20CI)](https://github.com/connorjburton/hmac-auth-express/actions/workflows/ci.yml)
[![GitHub](https://img.shields.io/github/license/connorjburton/hmac-auth-express)](https://github.com/connorjburton/hmac-auth-express/blob/master/LICENSE)


This package provides [Express](https://expressjs.com/) middleware for [HMAC](https://en.wikipedia.org/wiki/HMAC) authentication.

- :star2: Zero dependencies
- :clock1: Timing safe
- :white_check_mark: 100% code coverage
- :books: Support for all hash algorithms
- :lock: Replay attacks prevention

## Installation

**yarn**

`yarn add hmac-auth-express`

**npm**

`npm install hmac-auth-express`

## Usage

#### Importing the package

Supports both CommonJS & ECMAScript modules.

*CommonJS*
```javascript
const { HMAC } = require('hmac-auth-express');
```

*ECMAScript*
```javascript
import { HMAC } from 'hmac-auth-express';
```

See [FAQ's](#faqs) for design decisions around exports.

#### Basic middleware registration

This package **must** be registered *after* the `express.json()` middleware is registered.

```javascript
app.use('/api', HMAC('secret'));
```

#### Advanced middleware registration

```javascript
app.use('/api', HMAC('secret', {
  algorithm: 'sha512',
  identifier: 'APP',
  header: 'myheader',
  maxInterval: 600,
  minInterval: 600
});
```

#### Function parameters

The function will throw `TypeError`'s if you provide incorrect parameters.

| Parameter  | Accepted Type  | Default  | Description  |
|---|---|---|---|
| `secret`  | *string*  | `undefined`  | Your hash secret  |
| `options.algorithm`  | *string*  | `sha256`  | Your hashing algorithm  |
| `options.identifier`  | *string*  | `HMAC`  | The start of your `options.header` should start with this  |
| `options.header`  | *string*  | `authorization`  | The header the HMAC is located  |
| `options.maxInterval`  | *integer*  | `60 * 5`  | The amount of time you would like a request to be valid for, in seconds (in the past). See [time based protection against replay attacks](#replay-attacks) for more information  |
| `options.minInterval`  | *integer*  | `0`  | The amount of time you would like a request to be valid for, in seconds (in the future). See [time based protection against replay attacks](#replay-attacks) for more information  |

#### Error Handling

The middleware will pass an error to [express' error handler](http://expressjs.com/en/guide/error-handling.html#writing-error-handlers). You can use the provided `AuthError`, or alternatively check the error by its code `ERR_HMAC_AUTH_INVALID`.

Example:

```javascript
const { AuthError } = require('hmac-auth-express');

// express' error handler
app.use((error, req, res, next) => {
  // check by error instance
  if (error instanceof AuthError) {
    res.status(401).json({
      error: 'Invalid request',
      info: error.message
    })
  }

  // alternative: check by error code
  if (error.code === 'ERR_HMAC_AUTH_INVALID') {
    res.status(401).json({
      error: 'Invalid request',
      info: error.message
    })
  }

  else {
    // ... handle other errors
  }
})
```

## Structuring your HMAC header

Now you have configured your HMAC middleware, you need to structure your HMAC in the way the middleware expects.

#### What your HMAC should look like

*This example uses the default `options.header` and `options.identifier`.*

`Authorization: HMAC 1573504737300:76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86`

#### Constructing the HMAC

`Authorization:` This is the header you send in the request that contains the HMAC. This is what the middleware will look for.

`HMAC` This is the identifier the middleware will look for.

`1573504737300` This is the UNIX timestamp of when the request was sent.

`76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86` This is the HMAC digest, see [generating your HMAC digest](#generating-your-hmac-digest).

## Generating your HMAC digest

The HMAC signature is 4 parts (1 part optional) joined **without** a seperator.

| Part  | Required  | Example  | Description  |
|---|---|---|---|
| Unix Timestamp  | Yes  | `1573504737300`  | The current unix timestamp  |
| Verb  | Yes  | `POST`  | The verb of the request you are making |
| Route  | Yes  | `/api/order`  | The route you are requesting  |
| MD5 JSON Body  | No  | `9bb58f26192e4ba00f01e2e7b136bbd8`  | The MD5 of your `JSON.stringify` request body  |

Below is an example request and how we would build that requests HMAC

```
POST http://www.domain.com/api/order HTTP/1.0
Authorization: HMAC 1573504737300:76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86
Content-Type: application/json
Date: Wed, 13 Nov 2019 22:06:01 GMT

{
  "foo": "bar"
}
```

```javascript
const crypto = require('crypto');

const hmac = crypto.createHmac('sha256', 'secret');
const time = Date.now().toString();

hmac.update(time);
hmac.update('POST');
hmac.update('/api/order');

const contentHash = crypto.createHash('md5');
contentHash.update(JSON.stringify({"foo": "bar"}));

hmac.update(contentHash.digest('hex'));

console.log(`HMAC ${time}:${hmac.digest('hex')}`);
```

You can also use the exported `generate(secret: string, algorithm: string = 'sha256', unix: string | number, method: string, url: string, body?: Record<string, unknown> | unknown[]): crypto.Hmac` function.

```javascript
const { generate } = require('hmac-auth-express');

generate('secret', Date.now().toString(), 'POST', '/api/order', { foo: 'bar' }).digest('hex'); // 76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86
```

## Replay attacks

The parameter `options.maxInterval` is the amount of time in seconds that a request is valid. We compare the unix timestamp sent in the HMAC header to the current time on the server. If the time difference is greater than `options.maxInterval` request is rejected.

Similarly `options.minInterval` (introduced in `4.1.0`) is the amount of time in seconds that a request is valid for if in the future. This is a common issue for out of sync computer times (the requester time is slightly ahead of the server). If you find requests being rejected as they are from the future you may want to adjust this.

The unix timestamp sent in the header is also included in the HMAC digest, this is to prevent someone replicating a request and changing the unix timestamp to be in valid range of `options.maxInterval` or `options.minInterval`

## Limitations

This package does not support plain text, form or multi part POST bodies and is primarily intended to be used for JSON bodies. [Plain text support](https://github.com/connorjburton/hmac-auth-express/issues/61) is planned.

## Performance

You can run your own benchmarks by checking out the package and running `yarn benchmark`. Below are the most recent benchmark results.

| Environment  | Operations  | Duration  | ops/second  |
|---|---|---|---|
| `Windows 10 Pro, i5-7600K@3.80GHz`  | 1,000,000  | 24,793ms  | 40,334  |

## FAQs

*Why is HMAC uppercase?* HMAC is an acronym for [hash-based message authentication code](https://en.wikipedia.org/wiki/HMAC). You can import the package as below if you need to conform to style conventions.

```javascript
import { HMAC as hmac } from 'hmac-auth-express';
```

*Why is there no default export?* It seems to be non-trivial to export a default that has consistent behaviour between CommonJS & ECMASCript, the example below shows the behavioural differences when exporting a default from TypeScript.

```javascript
const HMAC = require('hmac-auth-express').default;
import HMAC from 'hmac-auth-exppress';
```

If you have a suggestion on how to export a default consistently then please [open an issue](https://github.com/connorjburton/hmac-auth-express/issues/new).

## Credits

Reference article https://www.wolfe.id.au/2012/10/20/what-is-hmac-authentication-and-why-is-it-useful/

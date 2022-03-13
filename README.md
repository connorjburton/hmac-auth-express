# HMAC Auth Express

[![npm](https://img.shields.io/npm/v/hmac-auth-express)](https://www.npmjs.com/package/hmac-auth-express)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/connorjburton/hmac-auth-express/Node.js%20CI)](https://github.com/connorjburton/hmac-auth-express/actions/workflows/ci.yml)
[![GitHub](https://img.shields.io/github/license/connorjburton/hmac-auth-express)](https://github.com/connorjburton/hmac-auth-express/blob/master/LICENSE)

This package provides [Express](https://expressjs.com/) middleware for [HMAC](https://en.wikipedia.org/wiki/HMAC) authentication.

-   :star2: Zero dependencies
-   :clock1: Timing safe
-   :white_check_mark: 100% code coverage
-   :books: Support for all hash algorithms
-   :lock: Replay attacks prevention

## Installation

**yarn**

`yarn add hmac-auth-express`

**npm**

`npm install hmac-auth-express`

## Type documentation

[View the documentation online here](https://connorjburton.github.io/hmac-auth-express), or run `yarn docs` in the repository.

## Usage

#### Importing the package

Supports both CommonJS & ECMAScript modules.

_CommonJS_

```javascript
const { HMAC } = require('hmac-auth-express');
```

_ECMAScript_

```javascript
import { HMAC } from 'hmac-auth-express';
```

See [FAQs](#faqs) for design decisions around exports.

#### Basic middleware registration

```javascript
app.use('/api', HMAC('secret'));
```

#### Advanced middleware registration

```javascript
app.use(
    '/api',
    HMAC('secret', {
        algorithm: 'sha512',
        identifier: 'APP',
        header: 'myheader',
        maxInterval: 600,
        minInterval: 600,
    })
);
```

[See the docs for full list of options.](https://connorjburton.github.io/hmac-auth-express/interfaces/Options.html)

If you are using this package to authenticate against routes with bodies, you must register the middleware after you have parsed and set the `request.body` property. The simplest way to achieve this is to use the built-in `express.json()` method.

```javascript
app.use(express.json());
app.use('/api', HMAC('secret'));
```

#### Error Handling

The middleware will throw `TypeError`'s if you provide incorrect parameters at registration time.

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
            info: error.message,
        });
    }

    // alternative: check by error code
    if (error.code === 'ERR_HMAC_AUTH_INVALID') {
        res.status(401).json({
            error: 'Invalid request',
            info: error.message,
        });
    }
});
```

## Dynamic Secret

From [8.2.0](https://github.com/connorjburton/hmac-auth-express/releases/tag/v8.2.0) onwards you can alternatively supply a function as your `secret` parameter. This function accepts 1 parameter, being an `express.Request` object. This function can be `async`. You can use this feature to dynamically determine the secret of the request, for example if you have different HMAC secrets depending on the URL of the request.

```javascript
const dynamicSecret = async (req) => {
    // determine and return what the secret should be from the request object

    return myDynamicSecret;
};

app.use(HMAC(dynamicSecret));
```

## Structuring your HMAC header

Now you have configured your HMAC middleware, you need to structure your HMAC in the way the middleware expects.

#### What your HMAC should look like

_This example uses the default `options.header` and `options.identifier`._

`Authorization: HMAC 1573504737300:76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86`

#### Constructing the HMAC

`Authorization:` This is the header you send in the request that contains the HMAC. This is what the middleware will look for.

`HMAC` This is the identifier the middleware will look for.

`1573504737300` This is the UNIX timestamp of when the request was sent.

`76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86` This is the HMAC digest, see [generating your HMAC digest](#generating-your-hmac-digest).

## Generating your HMAC digest

The HMAC signature is 4 parts (1 part optional) joined **without** a seperator.

| Part           | Required | Example                            | Description                                   |
| -------------- | -------- | ---------------------------------- | --------------------------------------------- |
| Unix Timestamp | Yes      | `1573504737300`                    | The current unix timestamp                    |
| Verb           | Yes      | `POST`                             | The verb of the request you are making        |
| Route          | Yes      | `/api/order`                       | The route you are requesting                  |
| MD5 JSON Body  | No       | `9bb58f26192e4ba00f01e2e7b136bbd8` | The MD5 of your `JSON.stringify` request body |

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
contentHash.update(JSON.stringify({ foo: 'bar' }));

hmac.update(contentHash.digest('hex'));

console.log(`HMAC ${time}:${hmac.digest('hex')}`);
```

You can also use the [exported generate function](https://connorjburton.github.io/hmac-auth-express/modules.html#generate) if you are using JavaScript on your client.

```javascript
const { generate } = require('hmac-auth-express');

const time = Date.now().toString();
const digest = generate('secret', 'sha256', time, 'POST', '/api/order', {
    foo: 'bar',
}).digest('hex'); // 76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86

const hmac = `HMAC ${time}:${digest}`;
```

## Replay attacks

The parameter `options.maxInterval` is the amount of time in seconds that a request is valid. We compare the unix timestamp sent in the HMAC header to the current time on the server. If the time difference is greater than `options.maxInterval` request is rejected.

Similarly `options.minInterval` (introduced in [4.1.0](https://github.com/connorjburton/hmac-auth-express/releases/tag/v4.1.0)) is the amount of time in seconds that a request is valid for if in the future. This is a common issue for out of sync computer times (the requester time is slightly ahead of the server). If you find requests being rejected as they are from the future you may want to adjust this.

The unix timestamp sent in the header is also included in the HMAC digest, this is to prevent someone replicating a request and changing the unix timestamp to be in valid range of `options.maxInterval` or `options.minInterval`

## How to handle non-deterministic JSON

In Node.js, JSON parsing is non-deterministic. This poses problems when depending on that order to build HMAC digests, as a difference in order of the request body between client and server will result in different HMAC digests and fail.

There are various solutions to this problem, with various levels of effort required. As this middleware intends to abstract away complexity in how to handle HMAC we have provided helpers and extensibility to help you solve this problem. This is available in version [8.3.0](https://github.com/connorjburton/hmac-auth-express/releases/tag/v8.3.0).

If you require your JSON parsing to be deterministic, you can use the [exported `order` function](https://connorjburton.github.io/hmac-auth-express/modules.html#order) and pass that as an [argument to `HMAC`](https://connorjburton.github.io/hmac-auth-express/interfaces/Options.html#order).

```javascript
import { HMAC, order } from 'hmac-auth-express';

app.use(HMAC('secret', { order }));
```

You will need to do the same on your client, the [`generate` method](https://connorjburton.github.io/hmac-auth-express/modules.html#generate) accepts an `options.order` parameter.

```javascript
const { generate, order } = require('hmac-auth-express');

const digest = generate(
    'secret',
    'sha256',
    Date.now().toString(),
    'POST',
    '/api/order',
    { foo: 'bar' },
    { order }
).digest('hex'); // 76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86

const hmac = `HMAC ${Date.now().toString()}:${digest}`;
```

This exported function recursively orders your object in lexigraphic order. This should be sufficient in most cases.

You can provide your own order function with your own implementation if you wish.

## Limitations

This package does not support plain text, form or multi part POST bodies and is primarily intended to be used for GET requests and JSON bodies. [Plain text support](https://github.com/connorjburton/hmac-auth-express/issues/61) is planned.

Be mindful of what algorithm you choose to use, this package will not stop you attempting to use an algorithm that is not supported by OpenSSL. [See the Node.js website for more information](https://nodejs.org/en/knowledge/cryptography/how-to-use-crypto-module/#hash-algorithms-that-work-with-crypto).

## Performance

You can run your own benchmarks by cloning the repository and running `yarn benchmark`. Below is an example result, however please run the benchmarks on your intended target machine for accurate results. Node.js >16 is required to run the benchmark tool.

| Environment                        | Operations | Duration | ops/second |
| ---------------------------------- | ---------- | -------- | ---------- |
| `Windows 10 Pro, i5-7600K@3.80GHz` | 1,000,000  | 752ms    | 1,329,767  |

## FAQs

_Why is HMAC uppercase?_ HMAC is an acronym for [hash-based message authentication code](https://en.wikipedia.org/wiki/HMAC). You can import the package as below if you need to conform to style conventions.

```javascript
import { HMAC as hmac } from 'hmac-auth-express';
```

_Why is there no default export?_ It seems to be non-trivial to export a default that has consistent behaviour between CommonJS & ECMAScript, the example below shows the behavioural differences when exporting a default from TypeScript.

```javascript
const HMAC = require('hmac-auth-express').default;
import HMAC from 'hmac-auth-express';
```

If you have a suggestion on how to export a default consistently then please [open an issue](https://github.com/connorjburton/hmac-auth-express/issues/new).

_Why is MD5 used instead of x?_ We use MD5 to create a hash of the request body (if available) as part of building the digest, which is then hashed in totality with SHA256 (by default), therefore we are not using MD5 to secure any part of this package. MD5 is used as it is faster than the built-in alternatives and adding an external dependency for a faster hashing algorithm such as Murmur is unnecessary.

## Credits

Reference article https://www.wolfe.id.au/2012/10/20/what-is-hmac-authentication-and-why-is-it-useful/

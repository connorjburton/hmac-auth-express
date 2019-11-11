# HMAC Auth Express

## Description

This module provides Express middleware for HMAC authentication. Zero dependencies, timing safe, support for all node hash algorithms, time based protection against replay attacks.

## Installation

**yarn**

`yarn add hmac-auth-express`

**npm**

`npm install hmac-auth-express`

## Usage

#### Basic middleware registration

```javascript
const hmac = require('hmac-auth-express');

app.use('/api', hmac('secret'));
```

#### Advanced middleware registration

```javascript
const hmac = require('hmac-auth-express');

app.use('/api', hmac('secret', {
  algorithm: 'sha512',
  identifier: 'APP',
  header: 'authorization',
  maxInterval: 600
});
```

#### Function parameters

The function will throw `TypeError`'s if you provide incorrect parameters.

| Parameter  | Accepted Type  | Default  | Description  |
|---|---|---|---|
| `secret`  | *string*  | `undefined`  | Your hash secret  |
| `options.algorithm`  | *string*  | `sha256`  | Your hashing algorithim  |
| `options.identifier`  | *string*  | `HMAC`  | The start of your `options.header` should start with this  |
| `options.header`  | *string*  | `authentication`  | The header the HMAC is located, should always be lowercase (express lowercases headers)  |
| `options.maxInterval`  | *integer*  | `60 * 5`  | The amount of time you would like a request to be valid for, in seconds. See [time based protection against replay attacks](#replay-attacks) for more information  |

#### Error Handling

The middleware will pass an error to [express' error handler](http://expressjs.com/en/guide/error-handling.html#writing-error-handlers). You can use the provided `HMACAuthError`, or alternatively check the error by its code `ERR_HMAC_AUTH_INVALID`.

Example:

```javascript
const { HMACAuthError } = require('hmac-auth-express/src/errors');

// express' error handler
app.use((error, req, res, next) => {
  // check by error instance
  if (error instanceof HMACAuthError) {
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

This example uses the default `options.header` and `options.identifier`. These will be different if you override said defaults

`Authentication: HMAC 1544528632:265dbc2a5d585adea736a0c68a9010569a43a8d6ed9ce2041b67fd385a3f84f9`

#### Constructing the HMAC

`Authencation:` This is the header you send in the request that contains the HMAC. This is what the middleware will look for.

`HMAC` This is the identifier the middleware will look for, this is fine to be left as the default

`1544528632` This is the unix timestamp of when the request was sent

`265dbc2a5d585adea736a0c68a9010569a43a8d6ed9ce2041b67fd385a3f84f9` This is the HMAC digest, see [generating your HMAC digest](#generating-your-hmac-digest)

## Generating your HMAC digest

The HMAC signature is 4 parts, joined **without** a seperator. **UNIX TIMESTAMP**, **VERB**, **ROUTE** and **MD5 CONTENT HASH**

Below is an example request and how we would build that request's HMAC

```
POST http://www.domain.com/api/order HTTP/1.0
Authentication: HMAC 1544540984:265dbc2a5d585adea736a0c68a9010569a43a8d6ed9ce2041b67fd385a3f84f9
Content-Type: application/json
Date: Tue, 11 Dec 2018 15:09:44 GMT

{
  "foo": "bar"
}
```

```javascript
const crypto = require('crypto');

const hmac = crypto.createHmac('sha256', 'secret');
const time = Math.floor(Date.now() / 1000).toString();

hmac.update(time);
hmac.update('POST');
hmac.update('/api/order');

const contentHash = crypto.createHash('md5');
contentHash.update(JSON.stringify({"foo": "bar"}));

hmac.update(contentHash.digest('hex'));

console.log(`HMAC ${time}:${hmac.digest('hex')}`);
```

## Replay attacks

The parameter `options.maxInterval` is the amount of time in seconds that a request is valid. We compare the unix timestamp sent in the HMAC header to the current time on the server. If the time difference is greater than `options.maxInterval` we reject the request.

The unix timestamp sent in the header is also included in the HMAC digest, this is to prevent someone replicating a request and just changing the unix timestamp to be in a valid range of `options.maxInterval`

## Credits

Reference article https://www.wolfe.id.au/2012/10/20/what-is-hmac-authentication-and-why-is-it-useful/

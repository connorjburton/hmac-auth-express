/* eslint-disable @typescript-eslint/ban-ts-comment */
import { request, Request, Response } from "express";
import { describe, it, mock, afterEach } from "node:test";
import { strict as assert } from "node:assert";
const crypto = await import("node:crypto");

import { HMAC, AuthError, generate, order } from "../../src/index.js";

interface MockRequest {
  headers?: {
    authorization?: string;
  };
  method?: "GET" | "POST";
  originalUrl?: string;
  body?: Record<string, unknown> | unknown[];
}

const SECRET = "secret";
const TIME = 1573504737300;
const METHOD = "POST";
const URL = "/api/order";
const BODY = { foo: "bar" };

const checkArgMessage = (
  calledArg: unknown
): calledArg is Record<string, undefined> => {
  return (
    typeof calledArg === "object" &&
    calledArg !== null &&
    "message" in calledArg
  );
};

function mockedRequest(override: MockRequest = {}): Partial<Request> {
  const req = request;
  req.headers = override.headers ?? {
    authorization: `HMAC ${TIME}:76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86`,
  };
  req.method = override.method ?? METHOD;
  req.originalUrl = override.originalUrl ?? URL;
  // We want to override body with undefined if we pass it in
  req.body = Object.prototype.hasOwnProperty.call(override, "body")
    ? override.body
    : BODY;

  return req;
}

describe("unit", () => {
  const spies = {
    next: mock.fn(),
  };

  afterEach(() => spies.next.mock.resetCalls());

  it("passes hmac", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET);

    await middleware(mockedRequest() as Request, {} as Response, spies.next);

    assert.strictEqual(spies.next.mock.calls.length, 1);
    assert.deepStrictEqual(spies.next.mock.calls[0].arguments, []);

    global.Date.now = originalDateNow;
  });

  it("passes hmac with GET", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET);

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            SECRET,
            undefined,
            TIME,
            "GET",
            URL,
            {}
          ).digest("hex")}`,
        },
        method: "GET",
        body: {},
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);
    assert.deepStrictEqual(spies.next.mock.calls[0].arguments, []);

    global.Date.now = originalDateNow;
  });

  it("passes hamc with array as value", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET);

    const body = [1, 2, 3];

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            SECRET,
            undefined,
            TIME,
            METHOD,
            URL,
            body
          ).digest("hex")}`,
        },
        body,
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);
    assert.deepStrictEqual(spies.next.mock.calls[0].arguments, []);

    global.Date.now = originalDateNow;
  });

  it("passes with every available algorithm", async (t) => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    for (const hash of crypto.getHashes()) {
      await t.test(hash, async () => {
        try {
          const middleware = HMAC(SECRET, { algorithm: hash });

          await middleware(
            mockedRequest({
              headers: {
                authorization: `HMAC ${TIME}:${generate(
                  SECRET,
                  hash,
                  TIME,
                  METHOD,
                  URL,
                  BODY
                ).digest("hex")}`,
              },
            }) as Request,
            {} as Response,
            spies.next
          );

          assert.strictEqual(spies.next.mock.calls.length, 1);
          assert.deepStrictEqual(spies.next.mock.calls[0].arguments, []);
        } catch (e) {
          // this error is for algos that are not supported by openssl
          // this can change per platform so we can not have a fixed exclusion list
          // instead we simply check if we get the error indicating it's not supported and skip over it
          if (
            e instanceof Error &&
            e?.message !== "error:00000000:lib(0):func(0):reason(0)" &&
            e?.message !== "error:00000000:lib(0)::reason(0)"
          ) {
            throw e;
          }
        }
      });
    }

    global.Date.now = originalDateNow;
  });

  it("passes hmac with different algorithm", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET, { algorithm: "blake2b512" });

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            SECRET,
            "blake2b512",
            TIME,
            METHOD,
            URL,
            BODY
          ).digest("hex")}`,
        },
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);
    assert.deepStrictEqual(spies.next.mock.calls[0].arguments, []);

    global.Date.now = originalDateNow;
  });

  it("passes hmac without body", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET);

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            SECRET,
            undefined,
            TIME,
            METHOD,
            URL
          ).digest("hex")}`,
        },
        body: undefined,
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);
    assert.deepStrictEqual(spies.next.mock.calls[0].arguments, []);

    global.Date.now = originalDateNow;
  });

  it("fails hmac not matching", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC("wrongsecret");

    await middleware(mockedRequest() as Request, {} as Response, spies.next);

    const calledArgs = spies.next.mock.calls.pop();
    const calledArg = Array.isArray(calledArgs?.arguments)
      ? calledArgs?.arguments[0]
      : undefined;
    assert(calledArg instanceof AuthError);
    if (checkArgMessage(calledArg)) {
      assert.strictEqual(calledArg?.["message"], "HMAC's did not match");
    }

    global.Date.now = originalDateNow;
  });

  it("fails hmac on no header", async () => {
    const middleware = HMAC(SECRET);

    await middleware(
      mockedRequest({ headers: {} }) as Request,
      {} as Response,
      spies.next
    );

    const calledArgs = spies.next.mock.calls.pop();
    const calledArg = Array.isArray(calledArgs?.arguments)
      ? calledArgs?.arguments[0]
      : undefined;
    assert(calledArg instanceof AuthError);
    if (checkArgMessage(calledArg)) {
      assert.strictEqual(
        calledArg?.["message"],
        "Header provided not in sent headers. Expected authorization but not found in request.headers"
      );
    }
  });

  it("fails hmac on no header with custom header", async () => {
    const middleware = HMAC(SECRET, { header: "myhmac" });

    await middleware(
      mockedRequest({ headers: {} }) as Request,
      {} as Response,
      spies.next
    );

    const calledArgs = spies.next.mock.calls.pop();
    const calledArg = Array.isArray(calledArgs?.arguments)
      ? calledArgs?.arguments[0]
      : undefined;
    assert(calledArg instanceof AuthError);
    if (checkArgMessage(calledArg)) {
      assert.strictEqual(
        calledArg?.["message"],
        "Header provided not in sent headers. Expected myhmac but not found in request.headers"
      );
    }
  });

  it("fails hmac on incorrect identifier", async () => {
    const middleware = HMAC(SECRET);

    await middleware(
      mockedRequest({ headers: { authorization: "FOO" } }) as Request,
      {} as Response,
      spies.next
    );

    const calledArgs = spies.next.mock.calls.pop();
    const calledArg = Array.isArray(calledArgs?.arguments)
      ? calledArgs?.arguments[0]
      : undefined;
    assert(calledArg instanceof AuthError);
    if (checkArgMessage(calledArg)) {
      assert.strictEqual(
        calledArg?.["message"],
        "Header did not start with correct identifier. Expected HMAC but not found in options.header"
      );
    }
  });

  it("fails hmac on incorrect identifier with custom identifier", async () => {
    const middleware = HMAC(SECRET, { identifier: "BAR" });

    await middleware(
      mockedRequest({ headers: { authorization: "FOO" } }) as Request,
      {} as Response,
      spies.next
    );

    const calledArgs = spies.next.mock.calls.pop();
    const calledArg = Array.isArray(calledArgs?.arguments)
      ? calledArgs?.arguments[0]
      : undefined;
    assert(calledArg instanceof AuthError);
    if (checkArgMessage(calledArg)) {
      assert.strictEqual(
        calledArg?.["message"],
        "Header did not start with correct identifier. Expected BAR but not found in options.header"
      );
    }
  });

  it("fails if unix timestamp not found", async () => {
    const middleware = HMAC(SECRET);

    await middleware(
      mockedRequest({
        headers: { authorization: "HMAC :a2bc3" },
      }) as Request,
      {} as Response,
      spies.next
    );

    const calledArgs = spies.next.mock.calls.pop();
    const calledArg = Array.isArray(calledArgs?.arguments)
      ? calledArgs?.arguments[0]
      : undefined;
    assert(calledArg instanceof AuthError);
    if (checkArgMessage(calledArg)) {
      assert.strictEqual(
        calledArg?.["message"],
        "Unix timestamp was not present in header"
      );
    }
  });

  it("fails if time difference too great", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => 1573508732400;

    const middleware = HMAC(SECRET);

    await middleware(mockedRequest() as Request, {} as Response, spies.next);

    const calledArgs = spies.next.mock.calls.pop();
    const calledArg = Array.isArray(calledArgs?.arguments)
      ? calledArgs?.arguments[0]
      : undefined;
    assert(calledArg instanceof AuthError);
    if (checkArgMessage(calledArg)) {
      assert.strictEqual(
        calledArg?.["message"],
        "Time difference between generated and requested time is too great"
      );
    }

    global.Date.now = originalDateNow;
  });

  it("fails if time difference too great with custom time", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => 1573591800000;

    // 1 day
    const middleware = HMAC(SECRET, { maxInterval: 86400 });

    await middleware(mockedRequest() as Request, {} as Response, spies.next);

    const calledArgs = spies.next.mock.calls.pop();
    const calledArg = Array.isArray(calledArgs?.arguments)
      ? calledArgs?.arguments[0]
      : undefined;
    assert(calledArg instanceof AuthError);
    if (checkArgMessage(calledArg)) {
      assert.strictEqual(
        calledArg?.["message"],
        "Time difference between generated and requested time is too great"
      );
    }

    global.Date.now = originalDateNow;
  });

  it("passes if within maxInterval", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => 1573588200000;

    // 1 day
    const middleware = HMAC(SECRET, { maxInterval: 86400 });

    await middleware(mockedRequest() as Request, {} as Response, spies.next);

    assert.strictEqual(spies.next.mock.calls.length, 1);

    global.Date.now = originalDateNow;
  });

  it("fails if time before timestamp in hmac", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => 1542055800000;

    const middleware = HMAC(SECRET);

    await middleware(mockedRequest() as Request, {} as Response, spies.next);

    const calledArgs = spies.next.mock.calls.pop();
    const calledArg = Array.isArray(calledArgs?.arguments)
      ? calledArgs?.arguments[0]
      : undefined;
    assert(calledArg instanceof AuthError);
    if (checkArgMessage(calledArg)) {
      assert.strictEqual(
        calledArg?.["message"],
        "Time difference between generated and requested time is too great"
      );
    }

    global.Date.now = originalDateNow;
  });

  it("passes if time before timestamp in hmac but minInterval is configured", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => 1573504736300;

    const middleware = HMAC(SECRET, { minInterval: 1 });

    await middleware(mockedRequest() as Request, {} as Response, spies.next);

    assert.strictEqual(spies.next.mock.calls.length, 1);

    global.Date.now = originalDateNow;
  });

  it("fails if missing hmac digest", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET);

    await middleware(
      mockedRequest({
        headers: { authorization: `HMAC ${TIME}:` },
      }) as Request,
      {} as Response,
      spies.next
    );

    const calledArgs = spies.next.mock.calls.pop();
    const calledArg = Array.isArray(calledArgs?.arguments)
      ? calledArgs?.arguments[0]
      : undefined;
    assert(calledArg instanceof AuthError);
    if (checkArgMessage(calledArg)) {
      assert.strictEqual(
        calledArg?.["message"],
        "HMAC digest was not present in header"
      );

      global.Date.now = originalDateNow;
    }
  });

  it("passes hmac with empty object as body", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET);

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            SECRET,
            undefined,
            TIME,
            METHOD,
            URL,
            {}
          ).digest("hex")}`,
        },
        body: {},
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);

    global.Date.now = originalDateNow;
  });

  it("passes hmac with basic object as body", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET);

    const body = { foo: "bar" };

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            SECRET,
            undefined,
            TIME,
            METHOD,
            URL,
            body
          ).digest("hex")}`,
        },
        body,
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);

    global.Date.now = originalDateNow;
  });

  it("passes hmac with complex object as body", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET);

    const body = { foo: "bar", baz: { fizz: 1, buzz: [1, 2] } };

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            SECRET,
            undefined,
            TIME,
            METHOD,
            URL,
            body
          ).digest("hex")}`,
        },
        body,
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);

    global.Date.now = originalDateNow;
  });

  it("passes hmac with empty array as body", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET);

    const body: [] = [];

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            SECRET,
            undefined,
            TIME,
            METHOD,
            URL,
            body
          ).digest("hex")}`,
        },
        body,
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);

    global.Date.now = originalDateNow;
  });

  it("passes hmac with array as body", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET);

    const body = [1, "test", {}, ["a", {}]];

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            SECRET,
            undefined,
            TIME,
            METHOD,
            URL,
            body
          ).digest("hex")}`,
        },
        body,
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);

    global.Date.now = originalDateNow;
  });

  it("hmac with async dynamic secret", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const dynamicSecret = async () => {
      // this is purely to test that calling await doesn't throw an error
      await Promise.resolve();
      return "dynamicsecret";
    };

    const middleware = HMAC(dynamicSecret);

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            "dynamicsecret",
            "sha256",
            TIME,
            METHOD,
            URL,
            BODY
          ).digest("hex")}`,
        },
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);

    global.Date.now = originalDateNow;
  });

  it("hmac correctly throws error if dynamic secret function returns undefined", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(() => undefined);

    await middleware(mockedRequest() as Request, {} as Response, spies.next);

    assert.deepStrictEqual(
      spies.next.mock.calls[0].arguments[0],
      new AuthError(
        "Invalid secret. Expected non-empty string but got 'undefined' (type: undefined)"
      )
    );

    global.Date.now = originalDateNow;
  });

  it("hmac correctly throws error if dynamic secret function returns array", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    // @ts-ignore
    const middleware = HMAC(() => [1, 2]);

    await middleware(mockedRequest() as Request, {} as Response, spies.next);

    assert.deepStrictEqual(
      spies.next.mock.calls[0].arguments[0],
      new AuthError(
        "Invalid secret. Expected non-empty string but got '1,2' (type: object)"
      )
    );

    global.Date.now = originalDateNow;
  });

  it("hmac correctly throws error if dynamic secret function returns empty string", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(() => "");

    await middleware(mockedRequest() as Request, {} as Response, spies.next);

    assert.deepStrictEqual(
      spies.next.mock.calls[0].arguments[0],
      new AuthError(
        "Invalid secret. Expected non-empty string but got '' (type: string)"
      )
    );

    global.Date.now = originalDateNow;
  });

  it("hmac correctly handles differently ordered json", async () => {
    const originalDateNow = Date.now.bind(global.Date);
    global.Date.now = () => TIME;

    const middleware = HMAC(SECRET, { order });

    const body = { foo: "bar", baz: "buzz" };

    await middleware(
      mockedRequest({
        headers: {
          authorization: `HMAC ${TIME}:${generate(
            SECRET,
            undefined,
            TIME,
            METHOD,
            URL,
            { baz: "buzz", foo: "bar" }
          ).digest("hex")}`,
        },
        body,
      }) as Request,
      {} as Response,
      spies.next
    );

    assert.strictEqual(spies.next.mock.calls.length, 1);

    global.Date.now = originalDateNow;
  });

  // Some users aren't going to be using TS, we need to ensure these test still work even though you can't expose the error if you use TS

  it("passing incorrect secret throws an error", () => {
    assert.throws(
      () => HMAC(""),
      new TypeError(
        `Invalid value provided for property secret. Expected non-empty string or function but got '' (type: string)`
      )
    );

    assert.throws(
      // @ts-ignore
      () => HMAC(23),
      new TypeError(
        `Invalid value provided for property secret. Expected non-empty string or function but got '23' (type: number)`
      )
    );
  });

  it("passing incorrect algorithm throws an error", () => {
    assert.throws(
      () => HMAC(SECRET, { algorithm: "sha111" }),
      new TypeError(
        `Invalid value provided for property options.algorithm. Expected value from crypto.getHashes() but got sha111 (type: string)`
      )
    );
  });

  it("passing incorrect identifier throws an error", () => {
    assert.throws(
      // @ts-ignore
      () => HMAC(SECRET, { identifier: 123 }),
      new TypeError(
        `Invalid value provided for property options.identifier. Expected non-empty string but got '123' (type: number)`
      )
    );
  });

  it("passing incorrect header throws an error", () => {
    assert.throws(
      // @ts-ignore
      () => HMAC(SECRET, { header: 123 }),
      new TypeError(
        `Invalid value provided for property options.header. Expected non-empty string but got '123' (type: number)`
      )
    );
  });

  it("passing incorrect maxInterval throws an error", () => {
    assert.throws(
      // @ts-ignore
      () => HMAC(SECRET, { maxInterval: "abc" }),
      new TypeError(
        `Invalid value provided for property options.maxInterval. Expected number but got 'abc' (type: string)`
      )
    );
  });

  it("passing incorrect minInterval throws an error", () => {
    assert.throws(
      // @ts-ignore
      () => HMAC(SECRET, { minInterval: "abc" }),
      new TypeError(
        `Invalid value provided for optional property options.minInterval. Expected positive number but got 'abc' (type: string)`
      )
    );
  });

  it("passing negative number for minInterval throws an error", () => {
    assert.throws(
      () => HMAC(SECRET, { minInterval: -1 }),
      new TypeError(
        `Invalid value provided for optional property options.minInterval. Expected positive number but got '-1' (type: number)`
      )
    );
  });
});

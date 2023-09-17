import { Server } from "http";
import express from "express";
import { describe, it, before, after } from "node:test";
import { strict as assert } from "node:assert";
import got, { Response } from "got";

import { HMAC, generate } from "../../src/index.js";

const PORT = 3000;
const SECRET = "secret";

describe("e2e", () => {
  describe("default", () => {
    let app: express.Application | undefined;
    let connection: Server;

    before((_, done) => {
      app = express();
      app.use(express.json());
      app.use(HMAC(SECRET));
      app.use(
        (
          _: Record<string, unknown>,
          _req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ): void => {
          res.sendStatus(401);
          next();
        },
      );
      app.post(
        "/test",
        (_, res: express.Response): express.Response => res.sendStatus(200),
      );
      connection = app.listen(PORT, done);
    });

    after(() => {
      app = undefined;
      connection.close();
    });

    it("passes hmac", async () => {
      const time: number = Date.now();
      const body = { foo: "bar" };
      const url = new URL(`http://127.0.0.1:${PORT}/test`);
      const response: Response = await got.post(url, {
        json: body,
        hooks: {
          beforeRequest: [
            (options) => {
              options.headers[
                "authorization"
              ] = `HMAC ${time.toString()}:${generate(
                SECRET,
                "sha256",
                time,
                options.method,
                url.pathname,
                body,
              ).digest("hex")}`;
            },
          ],
        },
      });

      assert.strictEqual(response.statusCode, 200);
    });
  });

  describe("dynamic secret", () => {
    let app: express.Application | undefined;
    let connection: Server;

    before((_, done) => {
      const dynamicSecret = (req: express.Request) => {
        if (req.path.includes("foo")) {
          return "firstsecret";
        }

        return "secondsecret";
      };

      app = express();
      app.use(express.json());
      app.use(HMAC(dynamicSecret));
      app.use(
        (
          _: Record<string, unknown>,
          _req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ): void => {
          res.sendStatus(401);
          next();
        },
      );
      app.post(
        "/foo",
        (_, res: express.Response): express.Response => res.sendStatus(200),
      );
      app.post(
        "/bar",
        (_, res: express.Response): express.Response => res.sendStatus(201),
      );
      connection = app.listen(PORT, done);
    });

    after(() => {
      app = undefined;
      connection.close();
    });

    it("passes with foo url", async () => {
      const time: number = Date.now();
      const body = { foo: "bar" };
      const url = new URL(`http://localhost:${PORT}/foo`);
      const response: Response = await got.post(url, {
        json: body,
        hooks: {
          beforeRequest: [
            (options) => {
              options.headers[
                "authorization"
              ] = `HMAC ${time.toString()}:${generate(
                "firstsecret",
                "sha256",
                time,
                options.method,
                url.pathname,
                body,
              ).digest("hex")}`;
            },
          ],
        },
      });

      assert.strictEqual(response.statusCode, 200);
    });

    it("passes with bar url", async () => {
      const time: number = Date.now();
      const body = { foo: "bar" };
      const url = new URL(`http://localhost:${PORT}/bar`);
      const response: Response = await got.post(url, {
        json: body,
        hooks: {
          beforeRequest: [
            (options) => {
              options.headers[
                "authorization"
              ] = `HMAC ${time.toString()}:${generate(
                "secondsecret",
                "sha256",
                time,
                options.method,
                url.pathname,
                body,
              ).digest("hex")}`;
            },
          ],
        },
      });

      assert.strictEqual(response.statusCode, 201);
    });
  });
});

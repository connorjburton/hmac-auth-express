import { Server } from 'http';
import express from 'express';
import got, { Response, NormalizedOptions } from 'got';
import { HMAC, generate } from '../../src/index';

const PORT = 3000;
const SECRET = 'secret';

describe('e2e', () => {
    describe('default', () => {
        let app: express.Application | undefined;
        let connection: Server;

        beforeAll((done: jest.DoneCallback) => {
            app = express();
            app.use(express.json());
            app.use(HMAC(SECRET));
            app.use(
                (
                    _: Record<string, unknown>,
                    _req: express.Request,
                    res: express.Response,
                    next: express.NextFunction
                ): void => {
                    res.sendStatus(401);
                    next();
                }
            );
            app.post(
                '/test',
                (_, res: express.Response): express.Response =>
                    res.sendStatus(200)
            );
            connection = app.listen(PORT, done);
        });

        afterAll(() => {
            app = undefined;
            connection.close();
        });

        test('passes hmac', async () => {
            const time: number = Date.now();
            const body = { foo: 'bar' };
            const response: Response = await got.post(
                `http://localhost:${PORT}/test`,
                {
                    json: body,
                    hooks: {
                        beforeRequest: [
                            (options: NormalizedOptions) => {
                                options.headers[
                                    'authorization'
                                ] = `HMAC ${time.toString()}:${generate(
                                    SECRET,
                                    'sha256',
                                    time,
                                    options.method,
                                    options.url.pathname,
                                    options.json
                                ).digest('hex')}`;
                            },
                        ],
                    },
                }
            );

            expect(response.statusCode).toBe(200);
        });
    });

    describe('dynamic secret', () => {
        let app: express.Application | undefined;
        let connection: Server;

        beforeAll((done: jest.DoneCallback) => {
            const dynamicSecret = (req: express.Request) => {
                if (req.path.includes('foo')) {
                    return 'firstsecret';
                }

                return 'secondsecret';
            };

            app = express();
            app.use(express.json());
            app.use(HMAC(dynamicSecret));
            app.use(
                (
                    _: Record<string, unknown>,
                    _req: express.Request,
                    res: express.Response,
                    next: express.NextFunction
                ): void => {
                    res.sendStatus(401);
                    next();
                }
            );
            app.post(
                '/foo',
                (_, res: express.Response): express.Response =>
                    res.sendStatus(200)
            );
            app.post(
                '/bar',
                (_, res: express.Response): express.Response =>
                    res.sendStatus(201)
            );
            connection = app.listen(PORT, done);
        });

        afterAll(() => {
            app = undefined;
            connection.close();
        });

        test('passes with foo url', async () => {
            const time: number = Date.now();
            const body = { foo: 'bar' };
            const response: Response = await got.post(
                `http://localhost:${PORT}/foo`,
                {
                    json: body,
                    hooks: {
                        beforeRequest: [
                            (options: NormalizedOptions) => {
                                options.headers[
                                    'authorization'
                                ] = `HMAC ${time.toString()}:${generate(
                                    'firstsecret',
                                    'sha256',
                                    time,
                                    options.method,
                                    options.url.pathname,
                                    options.json
                                ).digest('hex')}`;
                            },
                        ],
                    },
                }
            );

            expect(response.statusCode).toBe(200);
        });

        test('passes with bar url', async () => {
            const time: number = Date.now();
            const body = { foo: 'bar' };
            const response: Response = await got.post(
                `http://localhost:${PORT}/bar`,
                {
                    json: body,
                    hooks: {
                        beforeRequest: [
                            (options: NormalizedOptions) => {
                                options.headers[
                                    'authorization'
                                ] = `HMAC ${time.toString()}:${generate(
                                    'secondsecret',
                                    'sha256',
                                    time,
                                    options.method,
                                    options.url.pathname,
                                    options.json
                                ).digest('hex')}`;
                            },
                        ],
                    },
                }
            );

            expect(response.statusCode).toBe(201);
        });
    });
});

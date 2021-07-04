import { Server } from 'http';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import express from 'express';
import got, { Method, Response } from 'got';
import hmac from '../src/index.js';

const PORT: number = 3000;
const SECRET: string = 'secret';

const generate = (body: Record<string, any> | undefined, time: number, method: Method, path: string | undefined): string => {
    const hmac = crypto.createHmac('sha256', SECRET);

    hmac.update(time.toString());
    hmac.update(method);
    if (path) {
        hmac.update(path);
    }

    if (typeof body === 'object') {
        const contentHash = crypto.createHash('md5');
        contentHash.update(JSON.stringify(body));

        hmac.update(contentHash.digest('hex'));
    }

    return hmac.digest('hex');
}

describe('e2e', () => {
    let app: express.Application | undefined;
    let connection: Server;

    beforeAll((done: jest.DoneCallback) => {
        app = express();
        app.use(bodyParser.json());
        app.use(hmac(SECRET));
        app.use((err: { stack: object }, _req: express.Request, res: express.Response, next: Function): void => {
            console.error(err.stack);
            res.sendStatus(401);
            next();
        })
        app.post('/test', (_, res: express.Response): express.Response => res.sendStatus(200));
        connection = app.listen(PORT, done);
    });

    afterAll(() => {
        app = undefined;
        connection.close();
    })

    test('passes hmac', async () => {
        const time: number = Date.now();
        const body: object = { foo: 'bar' };
        const response: Response = await got.post(`http://localhost:${PORT}/test`, {
            json: body,
            hooks: {
                beforeRequest: [(options) => {
                    options.headers['authentication'] = `HMAC ${time.toString()}:${generate(options.json, time, options.method, options.url.pathname)}`
                }]
            }
        });

        expect(response.statusCode).toBe(200);
    });
});
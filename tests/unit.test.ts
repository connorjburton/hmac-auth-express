/* eslint-disable @typescript-eslint/ban-ts-comment */
import { request, Request, Response } from 'express';

import { HMAC, AuthError } from './../src/index.js';

interface MockRequest {
    headers?: {
        authorization?: string
    }
    method?: 'GET' | 'POST',
    originalUrl?: string,
    body?: Record<string, unknown> | unknown[]
}

interface Spies {
    next: jest.Mock
}

function mockedRequest(override: MockRequest = {}): Partial<Request> {
    const req = request;
    req.headers = override.headers ?? { authorization: 'HMAC 1573504737300:76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86' };
    req.method = override.method ?? 'POST';
    req.originalUrl = override.originalUrl ?? '/api/order';
    req.body = override.body ?? { foo: 'bar' };

    return req;
}

describe('unit', () => {
    const spies: Spies = {
        next: jest.fn()
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('passes hmac', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = HMAC('secret');

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    test('passes hamc with array as value', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = HMAC('secret');

        middleware(mockedRequest({ headers: { authorization: 'HMAC 1573504737300:4f1c59c68f09af0790b4531118438ae179689eebc5bb30a8359719e319f70b85' }, body: [1, 2, 3] }) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    test('passes hmac with different algorithm', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = HMAC('secret', { algorithm: 'ripemd160' });

        middleware(mockedRequest({ headers: { authorization: 'HMAC 1573504737300:b55d3ad0b64e106655871bbe7e0d1f55a1f81f7b' }}) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    test('passes hmac without body', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = HMAC('secret');

        middleware(mockedRequest({
            headers: {
                authorization: 'HMAC 1573504737300:39f9c6b0ea547d46ac03d4e7b0acd1194c2a06f1037620ba7986f8eb017c98ba'
            },
            body: undefined
        }) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    test('fails hmac not matching', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;

        const middleware = HMAC('wrongsecret');

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(AuthError);
        expect(calledArg.message).toBe('HMAC\'s did not match');

        global.Date.now = originalDateNow;
    });

    test('fails hmac on no header', () => {
        const middleware = HMAC('secret');

        middleware(mockedRequest({ headers: {} }) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(AuthError);
        expect(calledArg.message).toBe('Header provided not in sent headers. Expected authorization but not found in request.headers');
    });

    test('fails hmac on no header with custom header', () => {
        const middleware = HMAC('secret', { header: 'myhmac' });

        middleware(mockedRequest({ headers: {} }) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(AuthError);
        expect(calledArg.message).toBe('Header provided not in sent headers. Expected myhmac but not found in request.headers');
    });

    test('fails hmac on incorrect identifier', () => {
        const middleware = HMAC('secret');

        middleware(mockedRequest({ headers: { authorization: 'FOO' } }) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(AuthError);
        expect(calledArg.message).toBe('Header did not start with correct identifier. Expected HMAC but not found in options.header');
    });

    test('fails hmac on incorrect identifier with custom identifier', () => {
        const middleware = HMAC('secret', { identifier: 'BAR' });

        middleware(mockedRequest({ headers: { authorization: 'FOO' } }) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(AuthError);
        expect(calledArg.message).toBe('Header did not start with correct identifier. Expected BAR but not found in options.header');
    });

    test('fails if unix timestamp not found', () => {        
        const middleware = HMAC('secret');

        middleware(mockedRequest({ headers: { authorization: 'HMAC :a2bc3' } }) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(AuthError);
        expect(calledArg.message).toBe('Unix timestamp was not present in header');
    });

    test('fails if time difference too great', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573508732400;
        
        const middleware = HMAC('secret');

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(AuthError);
        expect(calledArg.message).toBe('Time difference between generated and requested time is too great');

        global.Date.now = originalDateNow;
    });

    test('fails if time difference too great with custom time', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573591800000;

        // 1 day
        const middleware = HMAC('secret', { maxInterval: 86400 });

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(AuthError);
        expect(calledArg.message).toBe('Time difference between generated and requested time is too great');

        global.Date.now = originalDateNow;
    });

    test('passes if within maxInterval', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573588200000;

        // 1 day
        const middleware = HMAC('secret', { maxInterval: 86400 });

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    test('fails if time before timestamp in hmac', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1542055800000;

        const middleware = HMAC('secret');

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(AuthError);
        expect(calledArg.message).toBe('Time difference between generated and requested time is too great');

        global.Date.now = originalDateNow;
    });

    test('passes if time before timestamp in hmac but minInterval is configured', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504736300;

        const middleware = HMAC('secret', { minInterval: 1 });

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    test('fails if missing hmac digest', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;

        const middleware = HMAC('secret');

        middleware(mockedRequest({ headers: { authorization: 'HMAC 1573504737300:' }}) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(AuthError);
        expect(calledArg.message).toBe('HMAC digest was not present in header');

        global.Date.now = originalDateNow;
    });

    test('passes hmac with empty object as body', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = HMAC('secret');

        middleware(mockedRequest({ body: {} }) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    test('passes hmac with basic object as body', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = HMAC('secret');

        middleware(mockedRequest({ body: { foo: 'bar' } }) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    test('passes hmac with complex object as body', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = HMAC('secret');

        middleware(mockedRequest({ body: { foo: 'bar', baz: { fizz: 1, buzz: [1, 2] } } }) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    test('passes hmac with empty array as body', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = HMAC('secret');

        middleware(mockedRequest({ body: [] }) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    test('passes hmac with array as body', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = HMAC('secret');

        middleware(mockedRequest({ body: [1, 'test', {}, ['a', {}]] }) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenCalledWith();

        global.Date.now = originalDateNow;
    });

    // Some users aren't going to be using TS, we need to ensure these test still work even though you can't expose the error if you use TS
    
    test('passing incorrect secret throws an error', () => {
        expect(() => HMAC('')).toThrowError(new TypeError(`Invalid value provided for property secret. Expected non-empty string but got '' (type: string)`));
        // @ts-ignore
        expect(() => HMAC(23)).toThrowError(new TypeError(`Invalid value provided for property secret. Expected non-empty string but got '23' (type: number)`));
    });

    test('passing incorrect algorithm throws an error', () => {
        expect(() => HMAC('secret', { algorithm: 'sha111' })).toThrowError(new TypeError(`Invalid value provided for property options.algorithm. Expected value from crypto.getHashes() but got sha111 (type: string)`));
    });

    test('passing incorrect identifier throws an error', () => {
        // @ts-ignore
        expect(() => HMAC('secret', { identifier: 123 })).toThrowError(new TypeError(`Invalid value provided for property options.identifier. Expected non-empty string but got '123' (type: number)`));
    });

    test('passing incorrect header throws an error', () => {
        // @ts-ignore
        expect(() => HMAC('secret', { header: 123 })).toThrowError(new TypeError(`Invalid value provided for property options.header. Expected non-empty string but got '123' (type: number)`));
    });

    test('passing incorrect maxInterval throws an error', () => {
        // @ts-ignore
        expect(() => HMAC('secret', { maxInterval: 'abc' })).toThrowError(new TypeError(`Invalid value provided for property options.maxInterval. Expected number but got 'abc' (type: string)`));
    });

    test('passing incorrect minInterval throws an error', () => {
        // @ts-ignore
        expect(() => HMAC('secret', { minInterval: 'abc' })).toThrowError(new TypeError(`Invalid value provided for optional property options.minInterval. Expected positive number but got 'abc' (type: string)`));
    });

    test('passing negative number for minInterval throws an error', () => {
        // @ts-ignore
        expect(() => HMAC('secret', { minInterval: -1 })).toThrowError(new TypeError(`Invalid value provided for optional property options.minInterval. Expected positive number but got '-1' (type: number)`));
    });
});
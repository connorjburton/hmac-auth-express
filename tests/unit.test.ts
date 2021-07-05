import { Request, Response } from 'express';

import hmac from './../src/index.js';
import { HMACAuthError } from './../src/errors.js';

type MockRequest = {
    headers: {
        authentication?: string
    }
    method?: 'GET' | 'POST',
    originalUrl?: string,
    body?: object | number[],
}

type Spies = {
    next: jest.Mock
}

function mockedRequest(override?: MockRequest): Partial<Request> {
    return {
        headers: {
            authentication: 'HMAC 1573504737300:76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86'
        },
        method: 'POST',
        originalUrl: '/api/order',
        body: {
            foo: 'bar'
        },
        ...override || {},
    };
};

describe('unit', () => {
    let spies: Spies = {
        next: jest.fn()
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('passes hmac', () => {
        try {
            const originalDateNow = Date.now.bind(global.Date);
            global.Date.now = () => 1573504737300;
            
            const middleware = hmac('secret');

            middleware(mockedRequest() as Request, {} as Response, spies.next);

            expect(spies.next).toHaveBeenLastCalledWith();

            global.Date.now = originalDateNow;
        } catch (err) {
            console.log(err);
        }
    });

    test('passes hamc with array as value', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = hmac('secret');

        middleware(mockedRequest({ headers: { authentication: 'HMAC 1573504737300:4f1c59c68f09af0790b4531118438ae179689eebc5bb30a8359719e319f70b85' }, body: [1, 2, 3] }) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenLastCalledWith();

        global.Date.now = originalDateNow;
    });

    test('passes hmac with different algorithm', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = hmac('secret', { algorithm: 'ripemd160' });

        middleware(mockedRequest({ headers: { authentication: 'HMAC 1573504737300:b55d3ad0b64e106655871bbe7e0d1f55a1f81f7b' }}) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenLastCalledWith();

        global.Date.now = originalDateNow;
    });

    test('passes hmac without body', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = hmac('secret');

        middleware(mockedRequest({
            headers: {
                authentication: 'HMAC 1573504737300:39f9c6b0ea547d46ac03d4e7b0acd1194c2a06f1037620ba7986f8eb017c98ba'
            },
            body: undefined
        }) as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenLastCalledWith();

        global.Date.now = originalDateNow;
    });

    test('fails hmac not matching', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;

        const middleware = hmac('wrongsecret');

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('HMAC\'s did not match');

        global.Date.now = originalDateNow;
    });

    test('fails hmac on no header', () => {
        const middleware = hmac('secret');

        middleware(mockedRequest({ headers: {} }) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Header provided not in sent headers. Expected authentication but not found in request.headers');
    });

    test('fails hmac on no header with custom header', () => {
        const middleware = hmac('secret', { header: 'myhmac' });

        middleware(mockedRequest({ headers: {} }) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Header provided not in sent headers. Expected myhmac but not found in request.headers');
    });

    test('fails hmac on incorrect identifier', () => {
        const middleware = hmac('secret');

        middleware(mockedRequest({ headers: { authentication: 'FOO' } }) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Header did not start with correct identifier. Expected HMAC but not found in options.header');
    });

    test('fails hmac on incorrect identifier with custom identifier', () => {
        const middleware = hmac('secret', { identifier: 'BAR' });

        middleware(mockedRequest({ headers: { authentication: 'FOO' } }) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Header did not start with correct identifier. Expected BAR but not found in options.header');
    });

    test('fails if unix timestamp not found', () => {        
        const middleware = hmac('secret');

        middleware(mockedRequest({ headers: { authentication: 'HMAC :a2bc3' } }) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Unix timestamp was not present in header');
    });

    test('fails if time difference too great', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573508732400;
        
        const middleware = hmac('secret');

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Time difference between generated and requested time is too great');

        global.Date.now = originalDateNow;
    });

    test('fails if time difference too great with custom time', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573591800000;

        // 1 day
        const middleware = hmac('secret', { maxInterval: 86400 });

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Time difference between generated and requested time is too great');

        global.Date.now = originalDateNow;
    });

    test('passes if within maxInterval', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573588200000;

        // 1 day
        const middleware = hmac('secret', { maxInterval: 86400 });

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenLastCalledWith();

        global.Date.now = originalDateNow;
    });

    test('fails if time before timestamp in hmac', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1542055800000;

        const middleware = hmac('secret');

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Time difference between generated and requested time is too great');

        global.Date.now = originalDateNow;
    });

    test('passes if time before timestamp in hmac but minInterval is configured', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504736300;

        const middleware = hmac('secret', { minInterval: 1 });

        middleware(mockedRequest() as Request, {} as Response, spies.next);

        expect(spies.next).toHaveBeenLastCalledWith();

        global.Date.now = originalDateNow;
    });

    test('fails if missing hmac digest', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;

        const middleware = hmac('secret');

        middleware(mockedRequest({ headers: { authentication: 'HMAC 1573504737300:' }}) as Request, {} as Response, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('HMAC digest was not present in header');

        global.Date.now = originalDateNow;
    });

    // Some users aren't going to be using TS, we need to ensure these test still work even though you can't expose the error if you use TS
    
    test('passing incorrect secret throws an error', () => {
        expect(() => hmac('')).toThrowError(new TypeError(`Invalid value provided for property secret. Expected non-empty string but got '' (type: string)`));
        // @ts-ignore
        expect(() => hmac(23)).toThrowError(new TypeError(`Invalid value provided for property secret. Expected non-empty string but got '23' (type: number)`));
    });

    test('passing incorrect algorithm throws an error', () => {
        expect(() => hmac('secret', { algorithm: 'sha111' })).toThrowError(new TypeError(`Invalid value provided for property options.algorithm. Expected value from crypto.getHashes() but got sha111`));
    });

    test('passing incorrect identifier throws an error', () => {
        // @ts-ignore
        expect(() => hmac('secret', { identifier: 123 })).toThrowError(new TypeError(`Invalid value provided for property options.identifier. Expected non-empty string but got '123' (type: number)`));
    });

    test('passing incorrect header throws an error', () => {
        // @ts-ignore
        expect(() => hmac('secret', { header: 123 })).toThrowError(new TypeError(`Invalid value provided for property options.header. Expected non-empty string but got '123' (type: number)`));
    });

    test('passing incorrect maxInterval throws an error', () => {
        // @ts-ignore
        expect(() => hmac('secret', { maxInterval: 'abc' })).toThrowError(new TypeError(`Invalid value provided for property options.maxInterval. Expected number but got 'abc' (type: string)`));
    });

    test('passing incorrect minInterval throws an error', () => {
        // @ts-ignore
        expect(() => hmac('secret', { minInterval: 'abc' })).toThrowError(new TypeError(`Invalid value provided for optional property options.minInterval. Expected positive number but got 'abc' (type: string)`));
    });

    test('passing negative number for minInterval throws an error', () => {
        // @ts-ignore
        expect(() => hmac('secret', { minInterval: -1 })).toThrowError(new TypeError(`Invalid value provided for optional property options.minInterval. Expected positive number but got '-1' (type: number)`));
    });
});
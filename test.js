import test from 'ava';
import hmac from './src/index';

test.beforeEach(t => {
    sinon.useFakeTimers(new Date('2018-12-11T00:00:00.000Z').getTime());

    t.fakes = {
        request: sinon.spy(),
        response: sinon.spy(),
        next: sinon.spy()
    }
});

test('correct hmac passes', t => {
    hmac('secret')(t.fakes.request, t.fakes.response, t.fakes.next);

    t.is(t.fakes.next);
});
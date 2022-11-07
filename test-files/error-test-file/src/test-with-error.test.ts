import {assert} from 'chai';
import {describe} from 'mocha';

describe('my describe with error', () => {
    it('should pass', () => {
        assert.isTrue(Reflect.has('derp' as any, 'thing'));
    });
});

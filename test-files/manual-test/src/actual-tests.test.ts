import {assert} from 'chai';
import {describe} from 'mocha';

describe('my describe description 1', () => {
    it('should pass', () => {
        assert.isTrue(true);
    });
    it('should fail 1', () => {
        assert.isFalse(true);
    });
});

describe('another describe call 1', () => {
    Array(5)
        .fill(0)
        .forEach((value, index) => {
            it(`should have more tests 1 ${index}`, () => {});
        });
});

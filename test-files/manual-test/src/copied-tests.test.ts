import {assert} from 'chai';
import {describe} from 'mocha';

describe('my describe description 2', () => {
    it('should pass', () => {
        assert.isTrue(true);
    });
    it('should fail 2', () => {
        assert.isFalse(true);
    });
});

describe('another describe call 2', () => {
    Array(5)
        .fill(0)
        .forEach((value, index) => {
            it(`should have more tests 2 ${index}`, () => {});
        });
});

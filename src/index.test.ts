import {removeColor} from 'augment-vir';
import {runShellCommand} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {dirname} from 'path';

const repoDirPath = dirname(__dirname);

describe(__filename, () => {
    it('should match output', async () => {
        const output = await runShellCommand(`npm run test:manual`, {
            cwd: repoDirPath,
        });

        const filteredOutput = removeColor(
            output.stdout
                .replace(
                    /(?:.|\n)+ts-node \.\/src\/setup-test\.ts && mocha --config \.mocharc\.js --sort --parallel=false[\s\n]+/,
                    '',
                )
                .replace(/^      at .+$/gm, '')
                .replace(/\s*\([\d.]+m?s\)\s*/, ''),
        ).trim();

        assert.strictEqual(output.stderr, '', 'stderr mismatch');
        assert.strictEqual(filteredOutput, expectedOutput, 'stdout mismatch');
        // it's intentionally failing so that we can see what a failure looks like
        assert.notStrictEqual(output.exitCode, 0, 'exit code mismatch');
    });
});

const expectedOutput = `src/actual-tests.test.ts
  my describe description 1
      ✔ should pass
      1) should fail 1
  another describe call 1
      ✔ should have more tests 1 0
      ✔ should have more tests 1 1
      ✔ should have more tests 1 2
      ✔ should have more tests 1 3
      ✔ should have more tests 1 4

src/copied-tests.test.ts
  my describe description 2
      ✔ should pass
      2) should fail 2
  another describe call 2
      ✔ should have more tests 2 0
      ✔ should have more tests 2 1
      ✔ should have more tests 2 2
      ✔ should have more tests 2 3
      ✔ should have more tests 2 4

  12 passing
  2 failing

  1) my describe description 1 (src/actual-tests.test.ts) 
       should fail 1:

      AssertionError: expected true to be false
      + expected - actual

      -true
      +false
      



  2) my describe description 2 (src/copied-tests.test.ts) 
       should fail 2:

      AssertionError: expected true to be false
      + expected - actual

      -true
      +false`;

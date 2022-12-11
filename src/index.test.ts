import {removeColor} from 'augment-vir';
import {runShellCommand, toPosixPath} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {basename, dirname, join} from 'path';

const repoDirPath = dirname(__dirname);

function filterOutput(rawOutput: string): string {
    return toPosixPath(
        removeColor(
            rawOutput
                .replace(
                    /(?:.|\n)+ts-node \.\/src\/setup-test\.ts && mocha --config configs\/mocha\.config\.ts --sort --parallel=false[\s\n]+/,
                    '',
                )
                .replace(/^      at .+$/gm, '')
                .replace(/\s*\([\d.]+m?s\)\s*/, ''),
        ).trim(),
    );
}

describe(basename(__filename), () => {
    it('should match output for copied files', async () => {
        const output = await runShellCommand(`npm test -s`, {
            cwd: join(repoDirPath, 'test-files', 'copied-test-file'),
        });

        const filteredOutput = filterOutput(output.stdout);

        assert.strictEqual(output.stderr, '', 'stderr mismatch');
        assert.strictEqual(filteredOutput, expectedOutput, 'stdout mismatch');
        // it's intentionally failing so that we can see what a failure looks like
        assert.notStrictEqual(output.exitCode, 0, 'exit code mismatch');
    });

    it('should fail on actual error', async () => {
        const output = await runShellCommand(`npm test -s`, {
            cwd: join(repoDirPath, 'test-files', 'error-test-file'),
        });

        const filteredOutput = filterOutput(output.stdout);

        assert.strictEqual(output.stderr, '', 'stderr mismatch');
        assert.strictEqual(filteredOutput, failureOutput, 'stdout mismatch');
        // it's intentionally failing so that we can see what a failure looks like
        assert.notStrictEqual(output.exitCode, 0, 'exit code mismatch');
    });
});

const failureOutput = `src/test-with-error.test.ts
  my describe with error
    1) should pass

  0 passing
  1 failing

  1) my describe with error (src/test-with-error.test.ts) 
       should pass:     TypeError: Reflect.has called on non-object`;

const expectedOutput = `src/actual-tests.test.ts
  my describe description 1
    nested describe
       ✔ should pass
      1) should fail 1
  another describe call 1
     ✔ should have more tests 1 0
     ✔ should have more tests 1 1
     ✔ should have more tests 1 2
     ✔ should have more tests 1 3
     ✔ should have more tests 1 4

src/copied-tests.test.ts
  my describe description 1
    nested describe
       ✔ should pass
      2) should fail 1
  another describe call 1
     ✔ should have more tests 1 0
     ✔ should have more tests 1 1
     ✔ should have more tests 1 2
     ✔ should have more tests 1 3
     ✔ should have more tests 1 4

  12 passing
  2 failing

  1) my describe description 1 (src/actual-tests.test.ts) 
       nested describe
         should fail 1:

      AssertionError: expected true to be false
      + expected - actual

      -true
      +false
      











  2) my describe description 1 (src/copied-tests.test.ts) 
       nested describe
         should fail 1:

      AssertionError: expected true to be false
      + expected - actual

      -true
      +false`;

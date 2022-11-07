import {interpolationSafeWindowsPath, runShellCommand} from 'augment-vir/dist/cjs/node-only';
import {rename} from 'fs/promises';
import {dirname, join, relative} from 'path';

const manualTestDir = dirname(__dirname);
const repoToTestDirPath = dirname(dirname(manualTestDir));

async function setupTest() {
    await runShellCommand(`npm run compile`, {
        cwd: repoToTestDirPath,
        rejectOnError: true,
    });
    const packOutput = await runShellCommand(`npm pack --json`, {
        cwd: repoToTestDirPath,
        rejectOnError: true,
    });

    const parsedOutput = JSON.parse(packOutput.stdout)[0];
    const newName = join(repoToTestDirPath, 'packed.tgz');
    await rename(join(repoToTestDirPath, parsedOutput.filename), newName);

    await runShellCommand(
        `npm install ${interpolationSafeWindowsPath(
            relative(manualTestDir, newName),
        )} --no-package-lock`,
        {
            cwd: manualTestDir,
            rejectOnError: true,
        },
    );
}

setupTest();

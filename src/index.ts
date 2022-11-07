/**
 * A lot of this code comes from or is based on the "spec" reporter that is built-in to Mocha. That
 * code is located here:
 * https://github.com/mochajs/mocha/blob/51d4746cf6ccefdcfcbc841c92f70efaa338e34f/lib/reporters/spec.js
 *
 * That code has the following license:
 */

/**
 * (The MIT License)
 *
 * Copyright (c) 2011-2022 OpenJS Foundation and contributors, https://openjsf.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the 'Software'), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {MochaOptions, reporters, Runner, Suite, Test, utils} from 'mocha';
import milliseconds from 'ms';
import {relative} from 'path';

const Base = reporters.Base as typeof reporters.Base & {
    consoleLog: (...args: any[]) => void;
    showDiff: (input: any) => boolean;
};

const {
    EVENT_RUN_END,
    EVENT_TEST_FAIL,
    EVENT_TEST_PASS,
    EVENT_SUITE_BEGIN,
    EVENT_SUITE_END,
    EVENT_TEST_PENDING,
} = Runner.constants;
const {EVENT_SUITE_ADD_TEST} = Suite.constants;
const baseColors = Base.colors;

const debug = process.argv.includes('--mocha-spec-with-name-debug');

function debugLog(...args: any[]): void {
    if (debug) {
        console.info(...args);
    }
}

const extraColors: Record<string, number | string> = {
    fileName: 7,
};

function color(type: string, str: string) {
    if (!Base.useColors) {
        return String(str);
    }
    const colorToUse = baseColors[type] ?? extraColors[type];
    return '\u001b[' + colorToUse + 'm' + str + '\u001b[0m';
}

function stringifyDiffObjs(err: any) {
    if (!(typeof err.actual === 'string') || !(typeof err.expected === 'string')) {
        err.actual = utils.stringify(err.actual);
        err.expected = utils.stringify(err.expected);
    }
}

type ActualSuiteWithFile = {
    id: string | undefined;
    file: string | undefined;
} & WithMochaId &
    Suite;

const mochaIdKey = '__mocha_id__';

type WithMochaId<T extends object | unknown = unknown> = T extends object
    ? Record<typeof mochaIdKey, string> & T
    : Record<typeof mochaIdKey, string>;

export class SpecReporterWithFileNames extends Base {
    // use this to easily get a path to this file so it can be handed to Mocha in a config file
    static readonly pathToThisReporter = __filename;

    constructor(runner: Runner, options?: MochaOptions) {
        super(runner, options);

        let indents = 0;
        let n = 0;

        function indent() {
            return Array(indents + 1).join('  ');
        }

        const loggedFiles = new Set();
        const loggedSuites = new Set();
        const suites = new Map<string, ActualSuiteWithFile>();

        function logTestSuite(suite: ActualSuiteWithFile, test: WithMochaId<Test>) {
            if (!suite.file) {
                suite.file = test.file;
            }
            if (!suite.id) {
                suite.id = suite[mochaIdKey];
            }
            const suiteParent = suite.parent;

            const isTopDescribe = !suiteParent?.parent;
            if (isTopDescribe && !loggedFiles.has(suite.file)) {
                loggedFiles.add(suite.file);
                Base.consoleLog();
                indents = 0;
                Base.consoleLog(
                    color('fileName', '%s%s'),
                    indent(),
                    relative(process.cwd(), suite.file ?? ''),
                );
                indents++;
            } else if (!isTopDescribe && suiteParent) {
                logTestSuite(suiteParent as ActualSuiteWithFile, test);
            }

            if (!loggedSuites.has(suite.id)) {
                Base.consoleLog(color('suite', '%s%s'), indent(), suite.title);
                loggedSuites.add(suite.id);
                indents++;
            }
        }

        runner
            .on(EVENT_SUITE_ADD_TEST, (test) => {
                debugLog(`====================================== EVENT_SUITE_ADD_TEST`);
                debugLog({test, id: (test as any)[mochaIdKey]});
                const suite = suites.get(
                    (test.parent as WithMochaId<Test> | undefined)?.[mochaIdKey] ?? '',
                );
                if (!suite) {
                    return;
                }

                logTestSuite(suite, test as WithMochaId<Test>);
            })
            .on(EVENT_SUITE_BEGIN, (suite) => {
                debugLog(`====================================== EVENT_SUITE_BEGIN`);
                debugLog({suite, id: (suite as any)[mochaIdKey]});
                // only add file names to the top most level suite
                suites.set((suite as unknown as WithMochaId<Suite>)[mochaIdKey], suite as any);
            })
            .on(EVENT_SUITE_END, () => {
                debugLog(`====================================== EVENT_SUITE_END`);
                --indents;
            })
            .on(EVENT_TEST_PENDING, (test) => {
                debugLog(`====================================== EVENT_TEST_PENDING`);
                debugLog({test, id: (test as any)[mochaIdKey]});
                Base.consoleLog(indent() + color('pending', '  - %s'), test.title);
            })
            .on(EVENT_TEST_PASS, (test) => {
                debugLog(`====================================== EVENT_TEST_PASS`);
                debugLog({test, id: (test as any)[mochaIdKey]});
                if (test.speed === 'fast') {
                    const format =
                        indent() + color('checkmark', ' ' + Base.symbols.ok) + color('pass', ' %s');
                    Base.consoleLog(format, test.title);
                } else {
                    const format =
                        indent() +
                        color('checkmark', ' ' + Base.symbols.ok) +
                        color('pass', ' %s') +
                        color(test.speed!, ' (%dms)');
                    Base.consoleLog(format, test.title, test.duration);
                }
            })
            .on(EVENT_TEST_FAIL, (test) => {
                debugLog(`====================================== EVENT_TEST_FAIL`);
                debugLog({test, id: (test as any)[mochaIdKey]});
                Base.consoleLog(indent() + color('fail', '%d) %s'), ++n, test.title);
            })
            .once(EVENT_RUN_END, (...args) => {
                debugLog(`====================================== EVENT_RUN_END`);
                debugLog({args, id: (args as any)[mochaIdKey]});
                this.finalMessage(...args);
            });
    }

    finalMessage() {
        var stats = this.stats;
        var fmt;

        Base.consoleLog();

        // passes
        fmt = color('bright pass', ' ') + color('green', ' %d passing') + color('light', ' (%s)');

        Base.consoleLog(fmt, stats.passes || 0, milliseconds(stats.duration!));

        // pending
        if (stats.pending) {
            fmt = color('pending', ' ') + color('pending', ' %d pending');

            Base.consoleLog(fmt, stats.pending);
        }

        // failures
        if (stats.failures) {
            fmt = color('fail', '  %d failing');

            Base.consoleLog(fmt, stats.failures);

            this.list(this.failures);
            Base.consoleLog();
        }

        Base.consoleLog();
    }

    list(failures: (Test & Record<string, any>)[]) {
        let multipleErr: any[];
        let multipleTest: any;
        Base.consoleLog();
        failures.forEach(function (test, i) {
            // format
            let fmt =
                color('error title', '  %s) %s:') +
                color('error message', '     %s') +
                color('error stack', '\n%s\n');

            // msg
            let msg;
            let err;
            const testErr = test.err as any;
            if (testErr && testErr.multiple) {
                if (multipleTest !== test) {
                    multipleTest = test;
                    multipleErr = [testErr].concat(testErr.multiple);
                }
                err = multipleErr.shift();
            } else {
                err = test.err;
            }
            let message;
            if (typeof err.inspect === 'function') {
                message = err.inspect() + '';
            } else if (err.message && typeof err.message.toString === 'function') {
                message = err.message + '';
            } else {
                message = '';
            }
            let stack = err.stack || message;
            let index = message ? stack.indexOf(message) : -1;

            if (index === -1) {
                msg = message;
            } else {
                index += message.length;
                msg = stack.slice(0, index);
                // remove msg from stack
                stack = stack.slice(index + 1);
            }

            // uncaught
            if (err.uncaught) {
                msg = 'Uncaught ' + msg;
            }
            // explicitly show diff
            if (!exports.hideDiff && Base.showDiff(err)) {
                stringifyDiffObjs(err);
                fmt = color('error title', '  %s) %s:\n%s') + color('error stack', '\n%s\n');
                let match = message.match(/^([^:]+): expected/);
                msg = '\n      ' + color('error message', match ? match[1] : msg);

                msg += Base.generateDiff(err.actual, err.expected);
            }

            // indent stack trace
            stack = stack.replace(/^/gm, '  ');

            // indented test title
            let testTitle = '';
            test.titlePath().forEach((str: string, index) => {
                if (index !== 0) {
                    testTitle += '\n     ';
                }
                for (let i = 0; i < index; i++) {
                    testTitle += '  ';
                }
                testTitle += str;
                if (index === 0) {
                    testTitle += ' (' + relative(process.cwd(), test.file!) + ') ';
                }
            });

            Base.consoleLog(fmt, i + 1, testTitle, msg, stack);
        });
    }
}

module.exports = SpecReporterWithFileNames;

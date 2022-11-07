const SpecReporterWithFileNames = require('mocha-spec-reporter-with-file-names');
const baseOptions = require('virmator/base-configs/base-mocharc.js');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    ...baseOptions,
    reporter: SpecReporterWithFileNames.pathToThisReporter,
};

module.exports = mochaConfig;

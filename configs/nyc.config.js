const {getBaseConfigWithCoveragePercent} = require('virmator/base-configs/base-nyc.js');

const nycConfig = {
    // the lines are covered in such a way that they aren't noticed at all by nyc
    ...getBaseConfigWithCoveragePercent(0),
};

module.exports = nycConfig;

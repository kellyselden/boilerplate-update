'use strict';

const semver = require('semver');
const utils = require('./utils');

module.exports = function resolveVersionRange(packageName, packageRange) {
  return utils.getVersions(packageName).then(packageVersions => {
    return semver.minSatisfying(packageVersions, packageRange);
  });
};

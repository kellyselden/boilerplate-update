'use strict';

const semver = require('semver');
const utils = require('./utils');

module.exports = async function resolveVersionRange(packageName, packageRange) {
  let packageVersions = await utils.getVersions(packageName);

  return semver.minSatisfying(packageVersions, packageRange);
};

'use strict';

const npm = require('./npm');

module.exports = function getVersions(packageName) {
  return npm.json(`view ${packageName} versions`);
};

'use strict';

const npm = require('./npm');

module.exports = async function getVersions(packageName) {
  return await npm.json(`view ${packageName} versions`);
};

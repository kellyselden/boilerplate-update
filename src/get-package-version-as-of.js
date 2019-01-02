'use strict';

const semver = require('semver');
const utils = require('./utils');

function getVersions(packageName) {
  return utils.run(`npm info ${packageName} time --json`).then(JSON.parse);
}

module.exports = function getPackageVersionAsOf(packageName, asOf) {
  return getVersions(packageName).then(versions => {
    let versionsInRange = Object.keys(versions).filter(version => {
      if (['created', 'modified'].includes(version)) {
        return;
      }
      return new Date(versions[version]) < asOf;
    });
    return semver.maxSatisfying(versionsInRange, '');
  });
};

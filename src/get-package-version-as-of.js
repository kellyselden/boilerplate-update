'use strict';

const semver = require('semver');
const utils = require('./utils');

function getVersions(packageName) {
  let output = utils.run(`npm info ${packageName} time --json`);
  let time = JSON.parse(output);
  return time;
}

module.exports = function getPackageVersionAsOf(packageName, asOf) {
  let versions = getVersions(packageName);
  let versionsInRange = Object.keys(versions).filter(version => {
    if (['created', 'modified'].includes(version)) {
      return false;
    }
    return new Date(versions[version]) < asOf;
  });
  let version = semver.maxSatisfying(versionsInRange, '');
  return version;
};

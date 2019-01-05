'use strict';

const semver = require('semver');
const getTimes = require('./get-times');

module.exports = function getPackageVersionAsOf(packageName, asOf) {
  return getTimes(packageName).then(versions => {
    let versionsInRange = Object.keys(versions).filter(version => {
      return new Date(versions[version]) < asOf;
    });
    return semver.maxSatisfying(versionsInRange, '');
  });
};

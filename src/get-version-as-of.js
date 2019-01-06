'use strict';

const semver = require('semver');

module.exports = function getVersionAsOf(times, asOf) {
  if (!(asOf instanceof Date)) {
    asOf = new Date(asOf);
  }
  let versionsInRange = Object.keys(times).filter(version => {
    return new Date(times[version]) < asOf;
  });
  return semver.maxSatisfying(versionsInRange, '');
};

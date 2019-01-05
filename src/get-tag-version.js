'use strict';

const npm = require('./npm');
const semver = require('semver');

module.exports = function getTagVersion({
  range,
  versions,
  distTags = [],
  packageName
}) {
  return Promise.resolve().then(() => {
    if (distTags.indexOf(range) > -1) {
      let distTag = range;
      return npm.json(`view ${packageName}@${distTag} version`);
    }

    let isAbsolute = !!semver.clean(range);
    if (!isAbsolute) {
      return semver.maxSatisfying(versions, range);
    }

    let version = range;
    return version;
  });
};

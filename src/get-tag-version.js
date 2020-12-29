'use strict';

const npm = require('./npm');
const semver = require('semver');

module.exports = async function getTagVersion({
  range,
  versions,
  distTags = [],
  packageName
}) {
  if (distTags.indexOf(range) > -1) {
    let distTag = range;
    return await npm.json(`view ${packageName}@${distTag} version`);
  }

  let isAbsolute = !!semver.clean(range);
  if (!isAbsolute) {
    return semver.maxSatisfying(versions, range);
  }

  let version = range;
  return version;
};

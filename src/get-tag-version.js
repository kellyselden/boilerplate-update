'use strict';

const utils = require('./utils');
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
      return utils.run(`npm info ${packageName}@${distTag} version --json`).then(JSON.parse);
    }

    let isAbsolute = !!semver.clean(range);
    if (!isAbsolute) {
      return semver.maxSatisfying(versions, range);
    }

    let version = range;
    return version;
  });
};

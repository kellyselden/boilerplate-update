'use strict';

const semver = require('semver');
const pacote = require('pacote');

module.exports = async function getTagVersion({
  range,
  versions,
  distTags = [],
  packageName,
}) {
  if (distTags.indexOf(range) > -1) {
    let distTag = range;
    let manifest = await pacote.manifest(`${packageName}@${distTag}`);
    return manifest.version;
  }

  let isAbsolute = !!semver.clean(range);
  if (!isAbsolute) {
    return semver.maxSatisfying(versions, range);
  }

  let version = range;
  return version;
};

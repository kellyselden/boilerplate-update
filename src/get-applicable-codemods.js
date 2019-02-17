'use strict';

const utils = require('./utils');
const semver = require('semver');
const co = require('co');
const resolveVersionRange = require('./resolve-version-range');
const pReduce = require('p-reduce');

module.exports = co.wrap(function* getApplicableCodemods({
  url,
  projectOptions,
  packageJson
}) {
  let nodeVersion = utils.getNodeVersion();

  let versionRanges = Object.assign({}, packageJson.dependencies, packageJson.devDependencies);

  let codemods = yield utils.getCodemods(url);

  let resolvedVersions = yield pReduce(Object.keys(codemods), (resolvedVersions, codemod) => {
    return pReduce(Object.keys(codemods[codemod].versions), co.wrap(function*(resolvedVersions, packageName) {
      let packageRange = versionRanges[packageName];
      if (packageRange && !resolvedVersions[packageName]) {
        resolvedVersions[packageName] = yield resolveVersionRange(packageName, packageRange);
      }
      return resolvedVersions;
    }), resolvedVersions);
  }, {});

  return Object.keys(codemods).filter((codemod) => {
    codemod = codemods[codemod];
    let keys = Object.keys(codemod.versions);
    let areVersionsInRange = keys.every(key => semver.gte(resolvedVersions[key], codemod.versions[key]));
    let hasCorrectProjectOption = projectOptions.some(option => codemod.projectOptions.includes(option));
    let isNodeVersionInRange = semver.gte(nodeVersion, codemod.nodeVersion);
    return areVersionsInRange && hasCorrectProjectOption && isNodeVersionInRange;
  }).reduce((applicableCodemods, codemod) => {
    applicableCodemods[codemod] = codemods[codemod];
    return applicableCodemods;
  }, {});
});

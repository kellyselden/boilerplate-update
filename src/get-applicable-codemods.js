'use strict';

const utils = require('./utils');
const semver = require('semver');
const resolveVersionRange = require('./resolve-version-range');
const pReduce = require('p-reduce');

module.exports = async function getApplicableCodemods({
  url,
  projectOptions,
  packageJson
}) {
  let nodeVersion = utils.getNodeVersion();

  let versionRanges = { ...packageJson.dependencies, ...packageJson.devDependencies };

  let codemods = await utils.getCodemods(url);

  let resolvedVersions = await pReduce(Object.keys(codemods), async(resolvedVersions, codemod) => {
    return await pReduce(Object.keys(codemods[codemod].versions), async(resolvedVersions, packageName) => {
      let packageRange = versionRanges[packageName];
      if (packageRange && !resolvedVersions[packageName]) {
        // eslint-disable-next-line require-atomic-updates
        resolvedVersions[packageName] = await resolveVersionRange(packageName, packageRange);
      }
      return resolvedVersions;
    }, resolvedVersions);
  }, {});

  return Object.entries(codemods).filter(([, codemod]) => {
    let keys = Object.keys(codemod.versions);
    let areVersionsInRange = keys.every(key => semver.gte(resolvedVersions[key], codemod.versions[key]));
    let hasCorrectProjectOption = projectOptions.some(option => codemod.projectOptions.includes(option));
    let isNodeVersionInRange = semver.gte(nodeVersion, codemod.nodeVersion);
    return areVersionsInRange && hasCorrectProjectOption && isNodeVersionInRange;
  }).reduce((applicableCodemods, [codemod, applicableCodemod]) => {
    applicableCodemods[codemod] = applicableCodemod;
    return applicableCodemods;
  }, {});
};

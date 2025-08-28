'use strict';

const utils = require('./utils');
const semver = require('semver');

module.exports = async function getApplicableCodemods({
  source,
  json,
  projectOptions,
  packageJson,
}) {
  let nodeVersion = utils.getNodeVersion();

  let versionRanges = { ...packageJson.dependencies, ...packageJson.devDependencies };

  let codemods = await utils.getCodemods(source, json);

  // eslint-disable-next-line prefer-let/prefer-let
  const { default: pReduce } = await import('p-reduce');

  let resolvedVersions = await pReduce(Object.keys(codemods), async(resolvedVersions, codemod) => {
    return await pReduce(Object.keys(codemods[codemod].versionRanges || {}), async(resolvedVersions, packageName) => {
      if (Object.prototype.hasOwnProperty.call(versionRanges, packageName) && !resolvedVersions[packageName]) {
        let versionRange = versionRanges[packageName];
        resolvedVersions[packageName] = semver.minVersion(versionRange).version;
      }
      return resolvedVersions;
    }, resolvedVersions);
  }, {});

  return Object.entries(codemods).filter(([, codemod]) => {
    let packageNames = Object.keys(codemod.versionRanges || {});
    let areVersionsInRange = packageNames.every(packageName => resolvedVersions[packageName] && semver.satisfies(resolvedVersions[packageName], codemod.versionRanges[packageName], { includePrerelease: true }));
    let hasCorrectProjectOption = !codemod.projectOptions || projectOptions.some(projectOption => codemod.projectOptions.includes(projectOption));
    let isNodeVersionInRange = semver.satisfies(nodeVersion, codemod.nodeVersionRange);
    return areVersionsInRange && hasCorrectProjectOption && isNodeVersionInRange;
  }).reduce((applicableCodemods, [codemod, applicableCodemod]) => {
    applicableCodemods[codemod] = applicableCodemod;
    return applicableCodemods;
  }, {});
};

'use strict';

const utils = require('./utils');
const semver = require('semver');

module.exports = function getApplicableCodemods({
  url,
  projectType,
  startVersion
}) {
  let nodeVersion = utils.getNodeVersion();

  return utils.getCodemods(url).then(codemods => {
    return Object.keys(codemods).filter(codemod => {
      codemod = codemods[codemod];
      let isVersionInRange = semver.gte(startVersion, codemod.version);
      let isCorrectProjectType = codemod.projectTypes.indexOf(projectType) !== -1;
      let isNodeVersionInRange = semver.gte(nodeVersion, codemod.nodeVersion);
      return isVersionInRange && isCorrectProjectType && isNodeVersionInRange;
    }).reduce((applicableCodemods, codemod) => {
      applicableCodemods[codemod] = codemods[codemod];
      return applicableCodemods;
    }, {});
  });
};

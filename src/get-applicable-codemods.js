'use strict';

const utils = require('./utils');
const semver = require('semver');
const co = require('co');

module.exports = co.wrap(function* getApplicableCodemods({
  url,
  projectType,
  startVersion
}) {
  let nodeVersion = utils.getNodeVersion();

  let codemods = yield utils.getCodemods(url);

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

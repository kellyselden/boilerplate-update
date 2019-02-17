'use strict';

const utils = require('./utils');
const semver = require('semver');
const co = require('co');

module.exports = co.wrap(function* getApplicableCodemods({
  url,
  projectOptions,
  startVersion
}) {
  let nodeVersion = utils.getNodeVersion();

  let codemods = yield utils.getCodemods(url);

  return Object.keys(codemods).filter(codemod => {
    codemod = codemods[codemod];
    let isVersionInRange = semver.gte(startVersion, codemod.version);
    let hasCorrectProjectOption = projectOptions.some(option => codemod.projectOptions.includes(option));
    let isNodeVersionInRange = semver.gte(nodeVersion, codemod.nodeVersion);
    return isVersionInRange && hasCorrectProjectOption && isNodeVersionInRange;
  }).reduce((applicableCodemods, codemod) => {
    applicableCodemods[codemod] = codemods[codemod];
    return applicableCodemods;
  }, {});
});

'use strict';

const utils = require('./utils');
const getApplicableCodemods = require('./get-applicable-codemods');

module.exports = function getAndPromptCodemods({
  url,
  projectOptions,
  packageJson
}) {
  return getApplicableCodemods({
    url,
    projectOptions,
    packageJson
  }).then(codemods => {
    return utils.promptCodemods(codemods);
  });
};

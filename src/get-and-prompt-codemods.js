'use strict';

const utils = require('./utils');
const getApplicableCodemods = require('./get-applicable-codemods');

module.exports = function getAndPromptCodemods({
  url,
  projectType,
  startVersion
}) {
  return getApplicableCodemods({
    url,
    projectType,
    startVersion
  }).then(codemods => {
    return utils.promptCodemods(codemods);
  });
};

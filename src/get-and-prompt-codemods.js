'use strict';

const utils = require('./utils');
const getApplicableCodemods = require('./get-applicable-codemods');

module.exports = function getAndPromptCodemods({
  url,
  projectOptions,
  startVersion
}) {
  return getApplicableCodemods({
    url,
    projectOptions,
    startVersion
  }).then(codemods => {
    return utils.promptCodemods(codemods);
  });
};

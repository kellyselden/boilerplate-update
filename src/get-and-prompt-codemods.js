'use strict';

const utils = require('./utils');
const getApplicableCodemods = require('./get-applicable-codemods');

module.exports = async function getAndPromptCodemods({
  url,
  projectOptions,
  packageJson
}) {
  let codemods = await getApplicableCodemods({
    url,
    projectOptions,
    packageJson
  });

  return await utils.promptCodemods(codemods);
};

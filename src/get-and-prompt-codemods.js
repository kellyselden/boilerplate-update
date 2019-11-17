'use strict';

const utils = require('./utils');
const getApplicableCodemods = require('./get-applicable-codemods');

module.exports = async function getAndPromptCodemods({
  url,
  json,
  projectOptions,
  packageJson
}) {
  let codemods = await getApplicableCodemods({
    url,
    json,
    projectOptions,
    packageJson
  });

  // Attach the name to the object for easy logging later.
  for (let [name, codemod] of Object.entries(codemods)) {
    codemod.name = name;
  }

  return await utils.promptCodemods(codemods);
};

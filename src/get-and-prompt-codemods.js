'use strict';

const utils = require('./utils');
const getApplicableCodemods = require('./get-applicable-codemods');

module.exports = async function getAndPromptCodemods({
  source,
  json,
  projectOptions,
  packageJson
}) {
  let codemods = await getApplicableCodemods({
    source,
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

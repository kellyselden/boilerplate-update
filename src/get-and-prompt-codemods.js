'use strict';

const getApplicableCodemods = require('./get-applicable-codemods');
const promptCodemods = require('./prompt-codemods');

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

  return await promptCodemods(codemods);
};

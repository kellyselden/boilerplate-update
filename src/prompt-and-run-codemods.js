'use strict';

const getAndPromptCodemods = require('./get-and-prompt-codemods');
const runCodemods = require('./run-codemods');

module.exports = async function promptAndRunCodemods({
  source,
  json,
  projectOptions,
  packageJson,
  cwd
}) {
  let codemods = await getAndPromptCodemods({
    source,
    json,
    projectOptions,
    packageJson
  });

  await runCodemods(codemods, cwd);
};

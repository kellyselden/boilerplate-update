'use strict';

const getAndPromptCodemods = require('./get-and-prompt-codemods');
const runCodemods = require('./run-codemods');

module.exports = async function promptAndRunCodemods({
  url,
  json,
  projectOptions,
  packageJson
}) {
  let codemods = await getAndPromptCodemods({
    url,
    json,
    projectOptions,
    packageJson
  });

  await runCodemods(codemods);
};

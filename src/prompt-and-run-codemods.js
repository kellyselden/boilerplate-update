'use strict';

const getAndPromptCodemods = require('./get-and-prompt-codemods');
const runCodemods = require('./run-codemods');

module.exports = async function promptAndRunCodemods({
  url,
  projectOptions,
  packageJson
}) {
  let codemods = await getAndPromptCodemods({
    url,
    projectOptions,
    packageJson
  });

  await runCodemods(codemods);
};

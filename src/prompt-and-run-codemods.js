'use strict';

const getAndPromptCodemods = require('./get-and-prompt-codemods');
const runCodemods = require('./run-codemods');

module.exports = function promptAndRunCodemods({
  url,
  projectOptions,
  packageJson
}) {
  return getAndPromptCodemods({
    url,
    projectOptions,
    packageJson
  }).then(codemods => {
    return runCodemods(codemods);
  });
};

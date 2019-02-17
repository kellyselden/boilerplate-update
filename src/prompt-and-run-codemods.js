'use strict';

const getAndPromptCodemods = require('./get-and-prompt-codemods');
const runCodemods = require('./run-codemods');

module.exports = function promptAndRunCodemods({
  url,
  projectOptions,
  startVersion
}) {
  return getAndPromptCodemods({
    url,
    projectOptions,
    startVersion
  }).then(codemods => {
    return runCodemods(codemods);
  });
};

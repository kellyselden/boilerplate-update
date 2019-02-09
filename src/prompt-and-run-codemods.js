'use strict';

const getAndPromptCodemods = require('./get-and-prompt-codemods');
const runCodemods = require('./run-codemods');

module.exports = function promptAndRunCodemods({
  url,
  projectType,
  startVersion
}) {
  return getAndPromptCodemods({
    url,
    projectType,
    startVersion
  }).then(codemods => {
    return runCodemods(codemods);
  });
};

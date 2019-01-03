'use strict';

const promptCodemods = require('./prompt-codemods');
const runCodemods = require('./run-codemods');

module.exports = function promptAndRunCodemods({
  url,
  projectType,
  startVersion
}) {
  return promptCodemods({
    url,
    projectType,
    startVersion
  }).then(codemods => {
    return runCodemods(codemods);
  });
};

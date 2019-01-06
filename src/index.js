'use strict';

const mergePackageJson = require('merge-package.json');
const gitDiffApply = require('git-diff-apply');
const run = require('./run');
const replaceFile = require('./replace-file');
const promptAndRunCodemods = require('./prompt-and-run-codemods');
const getStartAndEndCommands = require('./get-start-and-end-commands');

module.exports = function boilerplateUpdate({
  remoteUrl,
  startTag,
  endTag,
  resolveConflicts,
  reset,
  runCodemods,
  codemodsUrl,
  projectType,
  startVersion,
  createCustomDiff,
  customDiffOptions
}) {
  if (runCodemods) {
    return promptAndRunCodemods({
      url: codemodsUrl,
      projectType,
      startVersion
    });
  }

  let startCommand;
  let endCommand;

  return Promise.resolve().then(() => {
    if (createCustomDiff) {
      return getStartAndEndCommands(customDiffOptions).then(commands => {
        startCommand = commands.startCommand;
        endCommand = commands.endCommand;
      });
    }
  }).then(() => {
    let ignoredFiles;
    if (!reset) {
      ignoredFiles = ['package.json'];
    } else {
      ignoredFiles = [];
    }

    return gitDiffApply({
      remoteUrl,
      startTag,
      endTag,
      resolveConflicts,
      ignoredFiles,
      reset,
      createCustomDiff,
      startCommand,
      endCommand
    }).then(results => {
      if (reset) {
        return;
      }

      let fromPackageJson = results.from['package.json'];
      let toPackageJson = results.to['package.json'];

      return replaceFile('package.json', myPackageJson => {
        return mergePackageJson(myPackageJson, fromPackageJson, toPackageJson);
      }).then(() => {
        return run('git add package.json');
      });
    });
  });
};

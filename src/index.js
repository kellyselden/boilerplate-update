'use strict';

const mergePackageJson = require('merge-package.json');
const gitDiffApply = require('git-diff-apply');
const run = require('./run');
const replaceFile = require('./replace-file');
const promptAndRunCodemods = require('./prompt-and-run-codemods');
const getStartAndEndCommands = require('./get-start-and-end-commands');
const getStats = require('./get-stats');
const compareVersions = require('./compare-versions');

module.exports = function boilerplateUpdate({
  remoteUrl,
  compareOnly,
  resolveConflicts,
  reset,
  statsOnly,
  runCodemods,
  codemodsUrl,
  projectType,
  startVersion,
  endVersion,
  createCustomDiff,
  customDiffOptions
}) {
  let startTag = `v${startVersion}`;
  let endTag = `v${endVersion}`;

  if (compareOnly) {
    return compareVersions({
      remoteUrl,
      startTag,
      endTag
    });
  }

  if (statsOnly) {
    return getStats({
      projectType,
      startVersion,
      endVersion,
      remoteUrl,
      codemodsUrl
    });
  }

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

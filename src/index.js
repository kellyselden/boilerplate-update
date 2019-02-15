'use strict';

const mergePackageJson = require('merge-package.json');
const gitDiffApply = require('git-diff-apply');
const run = require('./run');
const replaceFile = require('./replace-file');
const promptAndRunCodemods = require('./prompt-and-run-codemods');
const getStartAndEndCommands = require('./get-start-and-end-commands');
const getStats = require('./get-stats');
const compareVersions = require('./compare-versions');
const co = require('co');

module.exports = co.wrap(function* boilerplateUpdate({
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
    compareVersions({
      remoteUrl,
      startTag,
      endTag
    });

    return;
  }

  if (statsOnly) {
    return yield getStats({
      projectType,
      startVersion,
      endVersion,
      remoteUrl,
      codemodsUrl
    });
  }

  if (runCodemods) {
    yield promptAndRunCodemods({
      url: codemodsUrl,
      projectType,
      startVersion
    });

    return;
  }

  let startCommand;
  let endCommand;

  if (createCustomDiff) {
    let commands = yield getStartAndEndCommands(customDiffOptions);

    startCommand = commands.startCommand;
    endCommand = commands.endCommand;
  }

  let ignoredFiles;
  if (!reset) {
    ignoredFiles = ['package.json'];
  } else {
    ignoredFiles = [];
  }

  let results = yield gitDiffApply({
    remoteUrl,
    startTag,
    endTag,
    resolveConflicts,
    ignoredFiles,
    reset,
    createCustomDiff,
    startCommand,
    endCommand
  });

  if (reset) {
    return;
  }

  let fromPackageJson = results.from['package.json'];
  let toPackageJson = results.to['package.json'];

  yield replaceFile('package.json', myPackageJson => {
    return mergePackageJson(myPackageJson, fromPackageJson, toPackageJson);
  });

  yield run('git add package.json');
});

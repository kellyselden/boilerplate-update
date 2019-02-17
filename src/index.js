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
  packageJson,
  projectOptions,
  startVersion,
  endVersion,
  createCustomDiff,
  customDiffOptions,
  wasRunAsExecutable
}) {
  let startTag = `v${startVersion}`;
  let endTag = `v${endVersion}`;

  if (compareOnly) {
    compareVersions({
      remoteUrl,
      startTag,
      endTag
    });

    return { promise: Promise.resolve() };
  }

  if (statsOnly) {
    return {
      promise: getStats({
        projectOptions,
        startVersion,
        endVersion,
        remoteUrl,
        codemodsUrl,
        packageJson
      })
    };
  }

  if (runCodemods) {
    return {
      promise: promptAndRunCodemods({
        url: codemodsUrl,
        projectOptions,
        packageJson
      })
    };
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

  let {
    from,
    to,
    resolveConflictsProcess
  } = yield gitDiffApply({
    remoteUrl,
    startTag,
    endTag,
    resolveConflicts,
    ignoredFiles,
    reset,
    createCustomDiff,
    startCommand,
    endCommand,
    wasRunAsExecutable
  });

  if (reset) {
    return { promise: Promise.resolve() };
  }

  let promise = co(function*() {
    if (resolveConflictsProcess) {
      yield new Promise(resolve => {
        resolveConflictsProcess.on('exit', resolve);
      });
    }

    let fromPackageJson = from['package.json'];
    let toPackageJson = to['package.json'];

    yield replaceFile('package.json', myPackageJson => {
      return mergePackageJson(myPackageJson, fromPackageJson, toPackageJson);
    });

    yield run('git add package.json');
  });

  return {
    promise,
    resolveConflictsProcess
  };
});

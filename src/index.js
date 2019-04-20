'use strict';

const mergePackageJson = require('merge-package.json');
const gitDiffApply = require('git-diff-apply');
const run = require('./run');
const replaceFile = require('./replace-file');
const promptAndRunCodemods = require('./prompt-and-run-codemods');
const getStartAndEndCommands = require('./get-start-and-end-commands');
const getStats = require('./get-stats');
const compareVersions = require('./compare-versions');
const getPackageJson = require('./get-package-json');
const _listCodemods = require('./list-codemods');
const co = require('co');

let callbackOptions = {};

function resolveProperty(property) {
  if (typeof property === 'function') {
    property = property(callbackOptions);
  }
  return Promise.resolve(property);
}

module.exports = co.wrap(function* boilerplateUpdate(options) {
  let {
    projectOptions,
    listCodemods,
    codemodsUrl,
    mergeOptions = {}
  } = options;

  let packageJson = yield getPackageJson();

  callbackOptions.packageJson = packageJson;

  projectOptions = yield resolveProperty(projectOptions);

  callbackOptions.projectOptions = projectOptions;

  codemodsUrl = yield resolveProperty(codemodsUrl);

  if (listCodemods) {
    return { promise: _listCodemods(codemodsUrl) };
  }

  let {
    remoteUrl,
    compareOnly,
    resolveConflicts,
    reset,
    statsOnly,
    runCodemods,
    startVersion,
    endVersion,
    createCustomDiff,
    customDiffOptions,
    ignoredFiles = [],
    wasRunAsExecutable
  } = Object.assign({}, options, yield resolveProperty(mergeOptions));

  startVersion = yield resolveProperty(startVersion);
  endVersion = yield resolveProperty(endVersion);

  callbackOptions.startVersion = startVersion;
  callbackOptions.endVersion = endVersion;

  let startTag = `v${startVersion}`;
  let endTag = `v${endVersion}`;

  remoteUrl = yield resolveProperty(remoteUrl);

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
    let commands = yield getStartAndEndCommands(yield resolveProperty(customDiffOptions));

    startCommand = commands.startCommand;
    endCommand = commands.endCommand;
  }

  if (!reset) {
    ignoredFiles.push('package.json');
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

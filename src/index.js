'use strict';

const mergePackageJson = require('merge-package.json');
const gitDiffApply = require('git-diff-apply');
const replaceFile = require('./replace-file');
const promptAndRunCodemods = require('./prompt-and-run-codemods');
const getStartAndEndCommands = require('./get-start-and-end-commands');
const getStats = require('./get-stats');
const compareVersions = require('./compare-versions');
const getPackageJson = require('./get-package-json');
const _listCodemods = require('./list-codemods');

const { run } = gitDiffApply;

let callbackOptions = {};

async function resolveProperty(property) {
  if (typeof property === 'function') {
    property = property(callbackOptions);
  }
  return await property;
}

async function boilerplateUpdate(options) {
  let {
    projectOptions,
    listCodemods,
    codemodsUrl,
    mergeOptions = {}
  } = options;

  let packageJson = await getPackageJson();

  callbackOptions.packageJson = packageJson;

  projectOptions = await resolveProperty(projectOptions);

  callbackOptions.projectOptions = projectOptions;

  codemodsUrl = await resolveProperty(codemodsUrl);

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
  } = { ...options, ...await resolveProperty(mergeOptions) };

  startVersion = await resolveProperty(startVersion);
  endVersion = await resolveProperty(endVersion);

  callbackOptions.startVersion = startVersion;
  callbackOptions.endVersion = endVersion;

  let startTag = `v${startVersion}`;
  let endTag = `v${endVersion}`;

  remoteUrl = await resolveProperty(remoteUrl);

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
    let commands = await getStartAndEndCommands(await resolveProperty(customDiffOptions));

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
  } = await gitDiffApply({
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

  let promise = (async() => {
    if (resolveConflictsProcess) {
      await new Promise(resolve => {
        resolveConflictsProcess.on('exit', resolve);
      });
    }

    let fromPackageJson = from['package.json'];
    let toPackageJson = to['package.json'];

    await replaceFile('package.json', async myPackageJson => {
      return await mergePackageJson(myPackageJson, fromPackageJson, toPackageJson);
    });

    await run('git add package.json');
  })();

  return {
    promise,
    resolveConflictsProcess
  };
}

module.exports = boilerplateUpdate;

'use strict';

const path = require('path');
const utils = require('./utils');
const { promisify } = require('util');
const { createTmpDir } = require('./tmp');
const rimraf = promisify(require('rimraf'));
const cpr = path.resolve(path.dirname(require.resolve('cpr')), '../bin/cpr');
const mutatePackageJson = require('./mutate-package-json');
const semver = require('semver');
const os = require('os');

module.exports = async function getStartAndEndCommands({
  cwd,
  reset,
  init,
  options
}) {
  function prepareOptions(key) {
    let _options = { ...options, ...options[key] };
    delete _options[key];
    return _options;
  }

  let startOptions = prepareOptions('startOptions');
  let endOptions = prepareOptions('endOptions');

  function _prepareCommand(options) {
    return module.exports.prepareCommand({
      cwd,
      options
    });
  }

  let startCommand;
  let endCommand;

  if (os.platform() === 'win32') {
    // running two npx commands in parallel on Windows causes it to break the npx cache
    // folders and throw strange permissions errors. We need to run them in series
    startCommand = await reset || init ? null : _prepareCommand(startOptions);
    endCommand = await _prepareCommand(endOptions);
  } else {
    [
      startCommand,
      endCommand
    ] = await Promise.all([
      reset || init ? null : _prepareCommand(startOptions),
      _prepareCommand(endOptions)
    ]);
  }

  return {
    startCommand,
    endCommand
  };
};

async function _prepareCommand({
  createProject,
  options
}) {
  let cwd = await createTmpDir();

  let appPath = await createProject(cwd);

  if (options.mutatePackageJson) {
    await mutatePackageJson(appPath, options.mutatePackageJson(options));
  }

  await Promise.all([
    rimraf(path.join(appPath, '.git')),
    rimraf(path.join(appPath, 'node_modules')),
    rimraf(path.join(appPath, 'package-lock.json')),
    rimraf(path.join(appPath, 'yarn.lock'))
  ]);

  return `node ${cpr} ${appPath} .`;
}

async function tryPrepareCommandUsingCache({
  basedir,
  options
}) {
  if (!options.packageName) {
    return;
  }

  // can't use resolve here because there is no "main" in package.json
  let packageRoot = path.join(basedir, 'node_modules', options.packageName);
  try {
    await utils.stat(packageRoot);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // no node_modules
      return;
    }
    throw err;
  }
  let packageVersion = utils.require(path.join(packageRoot, 'package.json')).version;

  let packageRange = typeof options.packageRange === 'string' ? options.packageRange : options.packageVersion;

  let isOutOfRange = !semver.satisfies(packageVersion, packageRange);

  if (isOutOfRange) {
    // installed version is out-of-date
    return;
  }

  return await _prepareCommand({
    createProject: options.createProjectFromCache({
      packageRoot,
      options
    }),
    options
  });
}

module.exports.prepareCommandUsingRemote = async function prepareCommandUsingRemote(options) {
  return await _prepareCommand({
    createProject: options.createProjectFromRemote({
      options
    }),
    options
  });
};

async function tryPrepareCommandUsingLocal(options, cwd) {
  for (let basedir of [
    cwd,
    path.resolve(__dirname, '../../..')
  ]) {
    let command = await tryPrepareCommandUsingCache({
      basedir,
      options
    });
    if (command) {
      return command;
    }
  }
}

async function tryPrepareCommandUsingGlobal(options) {
  if (!options.packageName) {
    return;
  }

  let command = options.commandName || options.packageName;

  let packagePaths;
  try {
    packagePaths = await utils.which(command, { all: true });
  } catch (err) {
    if (err.message === `not found: ${command}`) {
      // not installed globally
      return;
    }
    throw err;
  }

  // try all found executables
  for (let packagePath of packagePaths) {
    // try all known locations
    for (let basedir of [
      // for example
      // C:\Users\kelly\AppData\Roaming\npm\ember.CMD
      // C:\Users\kelly\AppData\Roaming\npm\node_modules\ember-cli
      path.dirname(packagePath),
      // for example
      // ember-cli-update/node_modules/.bin/ember =>
      // ember-cli-update/node_modules/ember-cli
      path.resolve(path.dirname(packagePath), '../..'),
      // for example
      // .nvm/versions/node/v8.16.1/bin/ember =>
      // .nvm/versions/node/v8.16.1/lib/node_modules/ember-cli
      path.resolve(path.dirname(packagePath), '../lib')
    ]) {
      let command = await tryPrepareCommandUsingCache({
        basedir,
        options
      });
      if (command) {
        return command;
      }
    }
  }
}

module.exports.prepareCommand = async function prepareCommand({
  cwd,
  options
}) {
  let command = await tryPrepareCommandUsingLocal(options, cwd);
  if (command) {
    return command;
  }

  command = await tryPrepareCommandUsingGlobal(options);
  if (command) {
    return command;
  }

  return await module.exports.prepareCommandUsingRemote(options);
};

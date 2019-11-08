'use strict';

const path = require('path');
const utils = require('./utils');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const rimraf = promisify(require('rimraf'));
const cpr = path.resolve(path.dirname(require.resolve('cpr')), '../bin/cpr');
const replaceFile = require('./replace-file');
const semver = require('semver');

async function mutatePackageJson(cwd, callback) {
  return await replaceFile(path.join(cwd, 'package.json'), async file => {
    let pkg = JSON.parse(file);
    await callback(pkg);
    return JSON.stringify(pkg, null, 2);
  });
}

module.exports = async function getStartAndEndCommands(options) {
  function prepareOptions(key) {
    let _options = { ...options, ...options[key] };
    delete _options[key];
    return _options;
  }

  let startOptions = prepareOptions('startOptions');
  let endOptions = prepareOptions('endOptions');

  let [
    startCommand,
    endCommand
  ] = await Promise.all([
    module.exports.prepareCommand(startOptions),
    module.exports.prepareCommand(endOptions)
  ]);

  return {
    startCommand,
    endCommand
  };
};

async function _prepareCommand({
  createProject,
  options
}) {
  let cwd = await tmpDir();

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

async function tryPrepareCommandUsingLocal(options) {
  return await tryPrepareCommandUsingCache({
    basedir: process.cwd(),
    options
  });
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

module.exports.prepareCommand = async function prepareCommand(options) {
  let command = await tryPrepareCommandUsingLocal(options);
  if (command) {
    return command;
  }

  command = await tryPrepareCommandUsingGlobal(options);
  if (command) {
    return command;
  }

  return await module.exports.prepareCommandUsingRemote(options);
};

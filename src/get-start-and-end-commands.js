'use strict';

const path = require('path');
const utils = require('./utils');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const rimraf = promisify(require('rimraf'));
const cpr = path.resolve(path.dirname(require.resolve('cpr')), '../bin/cpr');
const replaceFile = require('./replace-file');

async function mutatePackageJson(cwd, callback) {
  return await replaceFile(path.join(cwd, 'package.json'), async function(file) {
    let pkg = JSON.parse(file);
    await callback(pkg);
    return JSON.stringify(pkg, null, 2);
  });
}

module.exports = async function getStartAndEndCommands(options) {
  async function prepareCommand(key) {
    let _options = Object.assign({}, options, options[key]);
    delete _options[key];
    return await module.exports.prepareCommand(_options);
  }

  let [
    startCommand,
    endCommand
  ] = await Promise.all([
    prepareCommand('startOptions'),
    prepareCommand('endOptions')
  ]);

  return {
    startCommand,
    endCommand
  };
};

const _prepareCommand = async function _prepareCommand({
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
};

const tryPrepareCommandUsingCache = async function tryPrepareCommandUsingCache({
  basedir,
  options
}) {
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
  if (packageVersion !== options.packageVersion) {
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
};

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

const tryPrepareCommandUsingGlobal = async function tryPrepareCommandUsingGlobal(options) {
  let command = options.commandName || options.packageName;

  let packagePath;
  try {
    packagePath = await utils.which(command);
  } catch (err) {
    if (err.message === `not found: ${command}`) {
      // not installed globally
      return;
    }
    throw err;
  }

  return await tryPrepareCommandUsingCache({
    basedir: path.resolve(path.dirname(packagePath), '../lib'),
    options
  });
};

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

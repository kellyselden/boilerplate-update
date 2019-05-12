'use strict';

const path = require('path');
const utils = require('./utils');
const co = require('co');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const rimraf = promisify(require('rimraf'));
const cpr = path.resolve(path.dirname(require.resolve('cpr')), '../bin/cpr');
const replaceFile = require('./replace-file');

function mutatePackageJson(cwd, callback) {
  return replaceFile(path.join(cwd, 'package.json'), co.wrap(function*(file) {
    let pkg = JSON.parse(file);
    yield callback(pkg);
    return JSON.stringify(pkg, null, 2);
  }));
}

module.exports = co.wrap(function* getStartAndEndCommands(options) {
  function prepareCommand(key) {
    let _options = Object.assign({}, options, options[key]);
    delete _options[key];
    return module.exports.prepareCommand(_options);
  }

  let [
    startCommand,
    endCommand
  ] = yield Promise.all([
    prepareCommand('startOptions'),
    prepareCommand('endOptions')
  ]);

  return {
    startCommand,
    endCommand
  };
});

const _prepareCommand = co.wrap(function* _prepareCommand({
  createProject,
  options
}) {
  let cwd = yield tmpDir();

  let appPath = yield createProject(cwd);

  if (options.mutatePackageJson) {
    yield mutatePackageJson(appPath, options.mutatePackageJson(options));
  }

  yield Promise.all([
    rimraf(path.join(appPath, '.git')),
    rimraf(path.join(appPath, 'node_modules')),
    rimraf(path.join(appPath, 'package-lock.json')),
    rimraf(path.join(appPath, 'yarn.lock'))
  ]);

  return `node ${cpr} ${appPath} .`;
});

const tryPrepareCommandUsingCache = co.wrap(function* tryPrepareCommandUsingCache({
  basedir,
  options
}) {
  // can't use resolve here because there is no "main" in package.json
  let packageRoot = path.join(basedir, 'node_modules', options.packageName);
  try {
    yield utils.stat(packageRoot);
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
  return yield _prepareCommand({
    createProject: options.createProjectFromCache({
      packageRoot,
      options
    }),
    options
  });
});

module.exports.prepareCommandUsingRemote = function prepareCommandUsingRemote(options) {
  return _prepareCommand({
    createProject: options.createProjectFromRemote({
      options
    }),
    options
  });
};

function tryPrepareCommandUsingLocal(options) {
  return tryPrepareCommandUsingCache({
    basedir: process.cwd(),
    options
  });
}

const tryPrepareCommandUsingGlobal = co.wrap(function* tryPrepareCommandUsingGlobal(options) {
  let command = options.commandName || options.packageName;

  let packagePath;
  try {
    packagePath = yield utils.which(command);
  } catch (err) {
    if (err.message === `not found: ${command}`) {
      // not installed globally
      return;
    }
    throw err;
  }

  return tryPrepareCommandUsingCache({
    basedir: path.resolve(path.dirname(packagePath), '../lib'),
    options
  });
});

module.exports.prepareCommand = co.wrap(function* prepareCommand(options) {
  let command = yield tryPrepareCommandUsingLocal(options);
  if (command) {
    return command;
  }
  command = yield tryPrepareCommandUsingGlobal(options);
  if (command) {
    return command;
  }
  return yield module.exports.prepareCommandUsingRemote(options);
});

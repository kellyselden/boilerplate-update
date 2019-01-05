'use strict';

const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const denodeify = require('denodeify');
const tmpDir = denodeify(require('tmp').dir);
const rimraf = denodeify(require('rimraf'));
const cpr = path.resolve(path.dirname(require.resolve('cpr')), '../bin/cpr');
const replaceFile = require('./replace-file');

function mutatePackageJson(cwd, callback) {
  return replaceFile(path.join(cwd, 'package.json'), file => {
    let pkg = JSON.parse(file);
    return callback(pkg).then(() => {
      return JSON.stringify(pkg, null, 2);
    });
  });
}

module.exports = function getStartAndEndCommands(options) {
  function prepareCommand(key) {
    let _options = Object.assign({}, options, options[key]);
    delete _options[key];
    return module.exports.prepareCommand(_options);
  }

  return Promise.all([
    prepareCommand('startOptions'),
    prepareCommand('endOptions')
  ]).then(([
    startCommand,
    endCommand
  ]) => ({
    startCommand,
    endCommand
  }));
};

function _prepareCommand({
  createProject,
  options
}) {
  return tmpDir().then(cwd => {
    return createProject(cwd);
  }).then(appPath => {
    return Promise.resolve().then(() => {
      if (options.mutatePackageJson) {
        return mutatePackageJson(appPath, options.mutatePackageJson(options));
      }
    }).then(() => {
      return Promise.all([
        rimraf(path.join(appPath, '.git')),
        rimraf(path.join(appPath, 'node_modules')),
        rimraf(path.join(appPath, 'package-lock.json')),
        rimraf(path.join(appPath, 'yarn.lock'))
      ]);
    }).then(() => {
      return `node ${cpr} ${appPath} .`;
    });
  });
}

function tryPrepareCommandUsingCache({
  basedir,
  options
}) {
  return Promise.resolve().then(() => {
    // can't use resolve here because there is no "main" in package.json
    let packageRoot = path.join(basedir, 'node_modules', options.packageName);
    try {
      fs.statSync(packageRoot);
    } catch (err) {
      // no node_modules
      return;
    }
    let packageVersion = utils.require(path.join(packageRoot, 'package.json')).version;
    if (packageVersion !== options.packageVersion) {
      // installed version is out-of-date
      return;
    }
    return _prepareCommand({
      createProject: options.createProjectFromCache({
        packageRoot,
        options
      }),
      options
    });
  });
}

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

function tryPrepareCommandUsingGlobal(options) {
  let command = options.commandName || options.packageName;
  return utils.which(command).then(packagePath => {
    return tryPrepareCommandUsingCache({
      basedir: path.resolve(path.dirname(packagePath), '../lib'),
      options
    });
  }).catch(err => {
    if (err.message === `not found: ${command}`) {
      // not installed globally
      return;
    }
    throw err;
  });
}

module.exports.prepareCommand = function prepareCommand(options) {
  return tryPrepareCommandUsingLocal(options).then(command => {
    if (command) {
      return command;
    }
    return tryPrepareCommandUsingGlobal(options);
  }).then(command => {
    if (command) {
      return command;
    }
    return module.exports.prepareCommandUsingRemote(options);
  });
};

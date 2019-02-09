'use strict';

const fs = require('fs-extra');
const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');
const {
  processIo,
  processExit,
  fixtureCompare: _fixtureCompare
} = require('git-fixtures');
const boilerplateUpdate = require('../../src');
const utils = require('../../src/utils');
const buildTmp = require('../helpers/build-tmp');
const {
  assertNormalUpdate,
  assertNoUnstaged,
  assertCodemodRan
} = require('../helpers/assertions');

const commitMessage = 'add files';

describe('Acceptance - index', function() {
  this.timeout(30 * 1000);

  let cwd;
  let sandbox;
  let tmpPath;

  before(function() {
    cwd = process.cwd();
  });

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();

    process.chdir(cwd);
  });

  function merge({
    fixturesPath,
    runCodemods,
    subDir = '',
    startVersion = '2.11.1'
  }) {
    tmpPath = buildTmp({
      fixturesPath,
      commitMessage,
      subDir
    });

    process.chdir(tmpPath);

    return boilerplateUpdate({
      remoteUrl: 'https://github.com/kellyselden/boilerplate-update-output-repo-test',
      resolveConflicts: true,
      runCodemods,
      codemodsUrl: 'https://cdn.jsdelivr.net/gh/kellyselden/boilerplate-update-codemod-manifest-test/manifest.json',
      projectType: 'app',
      startVersion,
      endVersion: '3.2.0-beta.1'
    }).then(({
      promise: boilerplateUpdatePromise,
      resolveConflictsProcess
    }) => {
      if (!resolveConflictsProcess) {
        return processExit({
          promise: boilerplateUpdatePromise,
          cwd: tmpPath,
          commitMessage,
          expect
        });
      }

      let ioPromise = processIo({
        ps: resolveConflictsProcess,
        cwd: tmpPath,
        commitMessage,
        expect
      });

      return boilerplateUpdatePromise.then(() => {
        return ioPromise;
      });
    });
  }

  function fixtureCompare({
    mergeFixtures
  }) {
    let actual = tmpPath;
    let expected = path.join(cwd, mergeFixtures);

    _fixtureCompare({
      expect,
      actual,
      expected
    });
  }

  it('updates app', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/my-app'
    }).then(({
      status
    }) => {
      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/my-app'
      });

      assertNormalUpdate(status);
      assertNoUnstaged(status);
    });
  });

  it('runs codemods', function() {
    this.timeout(5 * 60 * 1000);

    sandbox.stub(utils, 'promptCodemods')
      .callsFake(codemods => Promise.resolve(Object.keys(codemods).map(k => codemods[k])));

    return merge({
      fixturesPath: 'test/fixtures/merge/my-app',
      runCodemods: true,
      startVersion: '3.2.0-beta.1'
    }).then(({
      status
    }) => {
      // file is indeterminent between OS's, so ignore
      fs.removeSync(path.join(tmpPath, 'MODULE_REPORT.md'));

      let mergeFixtures = 'test/fixtures/codemod/latest-node/my-app';
      if (process.env.NODE_LTS) {
        mergeFixtures = 'test/fixtures/codemod/min-node/my-app';
      }

      fixtureCompare({
        mergeFixtures
      });

      assertNoUnstaged(status);
      assertCodemodRan(status);
    });
  });

  it('scopes to sub dir if run from there', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/my-app',
      subDir: 'foo/bar'
    }).then(({
      status
    }) => {
      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/my-app'
      });

      assertNormalUpdate(status);
      assertNoUnstaged(status);
    });
  });
});

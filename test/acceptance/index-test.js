'use strict';

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
    startVersion = '0.0.1'
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
      codemodsUrl: 'https://raw.githubusercontent.com/kellyselden/boilerplate-update-codemod-manifest-test/master/manifest.json',
      projectType: 'test-project',
      startVersion,
      endVersion: '0.0.2'
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
      fixturesPath: 'test/fixtures/local/test-project'
    }).then(({
      status
    }) => {
      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/test-project'
      });

      assertNormalUpdate(status);
      assertNoUnstaged(status);
    });
  });

  it('runs codemods', function() {
    function selectAllCodemods(codemods) {
      return Promise.resolve(Object.keys(codemods).map(k => codemods[k]));
    }

    sandbox.stub(utils, 'promptCodemods').callsFake(selectAllCodemods);

    return merge({
      fixturesPath: 'test/fixtures/merge/test-project',
      runCodemods: true,
      startVersion: '0.0.2'
    }).then(({
      status
    }) => {
      let mergeFixtures = 'test/fixtures/codemod/latest-node/test-project';
      if (process.env.NODE_LTS) {
        mergeFixtures = 'test/fixtures/codemod/min-node/test-project';
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
      fixturesPath: 'test/fixtures/local/test-project',
      subDir: 'foo/bar'
    }).then(({
      status
    }) => {
      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/test-project'
      });

      assertNormalUpdate(status);
      assertNoUnstaged(status);
    });
  });
});

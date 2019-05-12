'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const path = require('path');
const sinon = require('sinon');
const {
  buildTmp,
  processIo,
  processExit,
  fixtureCompare: _fixtureCompare
} = require('git-fixtures');
const { isGitClean } = require('git-diff-apply');
const boilerplateUpdate = require('../../src');
const utils = require('../../src/utils');
const {
  assertNormalUpdate,
  assertNoUnstaged,
  assertNoStaged,
  assertCodemodRan
} = require('../helpers/assertions');

describe(function() {
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

  async function merge({
    fixturesPath,
    dirty,
    subDir,
    projectOptions = ['test-project', 'unused'],
    startVersion = '0.0.1',
    reset,
    compareOnly,
    statsOnly,
    runCodemods,
    listCodemods,
    createCustomDiff,
    ignoredFiles,
    commitMessage
  }) {
    tmpPath = await buildTmp({
      fixturesPath,
      commitMessage,
      dirty,
      subDir
    });

    process.chdir(tmpPath);

    function createProject({
      options
    }) {
      return async function createProject() {
        return path.resolve(__dirname, '../..', options.fixturesPath, options.projectName);
      };
    }

    try {
      let {
        promise: boilerplateUpdatePromise,
        resolveConflictsProcess
      } = await boilerplateUpdate({
        remoteUrl: () => 'https://github.com/kellyselden/boilerplate-update-output-repo-test',
        resolveConflicts: true,
        compareOnly,
        reset,
        statsOnly,
        runCodemods,
        listCodemods,
        codemodsUrl: 'https://raw.githubusercontent.com/kellyselden/boilerplate-update-codemod-manifest-test/master/manifest.json',
        projectOptions,
        startVersion,
        endVersion: '0.0.2',
        createCustomDiff,
        customDiffOptions: {
          projectName: 'test-project',
          packageName: 'test-project',
          createProjectFromCache: createProject,
          createProjectFromRemote: createProject,
          startOptions: {
            fixturesPath: 'test/fixtures/start'
          },
          endOptions: {
            fixturesPath: 'test/fixtures/end'
          }
        },
        ignoredFiles
      });

      if (!resolveConflictsProcess) {
        return await processExit({
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

      await boilerplateUpdatePromise;

      return await ioPromise;
    } catch (err) {
      return await processExit({
        promise: Promise.reject(err),
        cwd: tmpPath,
        commitMessage,
        expect
      });
    }
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

  it('updates app', async function() {
    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      commitMessage: 'test-project'
    });

    fixtureCompare({
      mergeFixtures: 'test/fixtures/merge/test-project'
    });

    assertNormalUpdate(status);
    assertNoUnstaged(status);
  });

  it('handles dirty', async function() {
    let {
      status,
      stderr
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      commitMessage: 'test-project',
      dirty: true
    });

    expect(status).to.equal(`?? a-random-new-file
`);

    expect(stderr).to.contain('You must start with a clean working directory');
    expect(stderr).to.not.contain('UnhandledPromiseRejectionWarning');
  });

  it('handles can\'t determine project', async function() {
    let {
      stderr
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      commitMessage: 'test-project',
      projectOptions() {
        throw 'can\'t determine project';
      }
    });

    expect(isGitClean({ cwd: tmpPath })).to.be.ok;

    expect(stderr).to.contain('can\'t determine project');
  });

  it('handles non-npm dir', async function() {
    let {
      stderr
    } = await merge({
      fixturesPath: 'test/fixtures/package-json/missing',
      commitMessage: 'test-project'
    });

    expect(isGitClean({ cwd: tmpPath })).to.be.ok;

    expect(stderr).to.contain('No package.json was found in this directory');
  });

  it('handles malformed package.json', async function() {
    let {
      stderr
    } = await merge({
      fixturesPath: 'test/fixtures/package-json/malformed',
      commitMessage: 'test-project'
    });

    expect(isGitClean({ cwd: tmpPath })).to.be.ok;

    expect(stderr).to.contain('The package.json is malformed');
  });

  it('resets app', async function() {
    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      commitMessage: 'test-project',
      reset: true
    });

    fixtureCompare({
      mergeFixtures: 'test/fixtures/end/test-project'
    });

    expect(status).to.match(/^ M present-added-changed\.txt$/m);
    expect(status).to.match(/^ M present-changed\.txt$/m);
    expect(status).to.match(/^ D removed-changed\.txt$/m);
    expect(status).to.match(/^ D removed-unchanged\.txt$/m);
    expect(status).to.match(/^\?{2} added-changed\.txt$/m);
    expect(status).to.match(/^\?{2} added-unchanged\.txt$/m);
    expect(status).to.match(/^\?{2} missing-changed\.txt$/m);
    expect(status).to.match(/^\?{2} missing-unchanged\.txt$/m);

    assertNoStaged(status);
  });

  it('opens compare url', async function() {
    let open = sandbox.stub(utils, 'open');

    let {
      result,
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      commitMessage: 'test-project',
      compareOnly: true
    });

    assertNoUnstaged(status);

    expect(result, 'don\'t accidentally print anything to the console').to.be.undefined;

    expect(open.calledOnce).to.be.ok;
    expect(open.args[0][0]).to.equal('https://github.com/kellyselden/boilerplate-update-output-repo-test/compare/v0.0.1...v0.0.2');
  });

  it('shows stats only', async function() {
    let {
      result,
      status
    } = await merge({
      fixturesPath: 'test/fixtures/merge',
      commitMessage: 'test-project',
      statsOnly: true
    });

    assertNoStaged(status);

    expect(result).to.equal(`project options: test-project, unused
from version: 0.0.1
to version: 0.0.2
output repo: https://github.com/kellyselden/boilerplate-update-output-repo-test
applicable codemods: commands-test-codemod${process.env.NODE_LTS ? '' : ', script-test-codemod'}`);
  });

  it('lists codemods', async function() {
    let {
      result,
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      commitMessage: 'test-project',
      listCodemods: true
    });

    assertNoStaged(status);

    expect(JSON.parse(result)).to.have.own.property('commands-test-codemod');
  });

  it('runs codemods', async function() {
    async function selectAllCodemods(codemods) {
      return Object.keys(codemods).map(k => codemods[k]);
    }

    sandbox.stub(utils, 'promptCodemods').callsFake(selectAllCodemods);

    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/merge',
      commitMessage: 'test-project',
      runCodemods: true
    });

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

  it('scopes to sub dir if run from there', async function() {
    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      commitMessage: 'test-project',
      subDir: 'foo/bar'
    });

    fixtureCompare({
      mergeFixtures: 'test/fixtures/merge/test-project'
    });

    assertNormalUpdate(status);
    assertNoUnstaged(status);
  });

  it('can create a personal diff instead of using an output repo', async function() {
    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      commitMessage: 'test-project',
      createCustomDiff: true
    });

    fixtureCompare({
      mergeFixtures: 'test/fixtures/merge/test-project'
    });

    assertNoUnstaged(status);
  });

  it('can ignore extra files', async function() {
    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      commitMessage: 'test-project',
      ignoredFiles: ['present-changed.txt']
    });

    expect(status).to.not.contain('present-changed.txt');

    assertNoUnstaged(status);
  });
});

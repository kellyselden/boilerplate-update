'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const path = require('path');
const fs = require('fs-extra');
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
    reset,
    init,
    startVersion = '0.0.1',
    compareOnly,
    statsOnly,
    runCodemods,
    codemodsJson,
    listCodemods,
    createCustomDiff,
    ignoredFiles
  }) {
    let commitMessage = 'test-project';

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
        init,
        statsOnly,
        runCodemods,
        listCodemods,
        codemodsUrl: 'git+ssh://git@github.com/kellyselden/boilerplate-update-codemod-manifest-test.git#semver:*',
        codemodsJson,
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
      fixturesPath: 'test/fixtures/local'
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
      projectOptions() {
        throw 'can\'t determine project';
      }
    });

    expect(await isGitClean({ cwd: tmpPath })).to.be.ok;

    expect(stderr).to.contain('can\'t determine project');
  });

  it('handles non-npm dir', async function() {
    let {
      stderr
    } = await merge({
      fixturesPath: 'test/fixtures/package-json/missing'
    });

    expect(await isGitClean({ cwd: tmpPath })).to.be.ok;

    expect(stderr).to.contain('No package.json was found in this directory');
  });

  it('handles malformed package.json', async function() {
    let {
      stderr
    } = await merge({
      fixturesPath: 'test/fixtures/package-json/malformed'
    });

    expect(await isGitClean({ cwd: tmpPath })).to.be.ok;

    expect(stderr).to.contain('The package.json is malformed');
  });

  it('resets app', async function() {
    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
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

  it('inits app', async function() {
    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      init: true
    });

    fixtureCompare({
      mergeFixtures: 'test/fixtures/init/test-project'
    });

    expect(status).to.match(/^ M present-added-changed\.txt$/m);
    expect(status).to.match(/^ M present-changed\.txt$/m);
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
      listCodemods: true
    });

    assertNoStaged(status);

    expect(JSON.parse(result)).to.have.own.property('commands-test-codemod');
  });

  it('accepts codemods via json string', async function() {
    let {
      result,
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      listCodemods: true,
      codemodsJson: JSON.stringify({
        'test-codemod-json': {
          versions: {
            lodash: '3.0.0'
          },
          projectOptions: ['test-project', 'unused'],
          nodeVersion: '6.0.0',
          commands: []
        }
      })
    });

    assertNoStaged(status);

    expect(JSON.parse(result)).to.have.own.property('test-codemod-json');
  });

  it('runs codemods', async function() {
    async function selectAllCodemods(codemods) {
      return Object.values(codemods);
    }

    sandbox.stub(utils, 'promptCodemods').callsFake(selectAllCodemods);

    let log = sandbox.stub(console, 'log');

    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/merge',
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

    expect(log.withArgs('Running codemod commands-test-codemod')).to.be.called;
    expect(log.withArgs('Running command 1 of 2')).to.be.called;
    expect(log.withArgs('Finished running command 1 of 2')).to.be.called;
    expect(log.withArgs('Running command 2 of 2')).to.be.called;
    expect(log.withArgs('Finished running command 2 of 2')).to.be.called;
    expect(log.withArgs('Finished running codemod commands-test-codemod')).to.be.called;
    if (!process.env.NODE_LTS) {
      expect(log.withArgs('Running codemod script-test-codemod')).to.be.called;
      expect(log.withArgs('Finished running codemod script-test-codemod')).to.be.called;
    }
  });

  it('scopes to sub dir if run from there', async function() {
    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      subDir: 'foo/bar'
    });

    fixtureCompare({
      mergeFixtures: 'test/fixtures/merge/test-project'
    });

    assertNormalUpdate(status);
    assertNoUnstaged(status);
  });

  describe('custom diff', function() {
    it('can create a personal diff instead of using an output repo', async function() {
      let {
        status
      } = await merge({
        fixturesPath: 'test/fixtures/local',
        createCustomDiff: true
      });

      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/test-project'
      });

      assertNoUnstaged(status);
    });

    it('can ignore one of the versions', async function() {
      let {
        status
      } = await merge({
        fixturesPath: 'test/fixtures/local',
        createCustomDiff: true,
        startVersion: null
      });

      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/test-project'
      });

      assertNoUnstaged(status);

      let stagedCommitMessage = await fs.readFile(path.join(tmpPath, '.git/MERGE_MSG'), 'utf8');

      expect(stagedCommitMessage).to.startWith('v0.0.2');
    });
  });

  it('can ignore extra files', async function() {
    let {
      status
    } = await merge({
      fixturesPath: 'test/fixtures/local',
      ignoredFiles: ['present-changed.txt']
    });

    expect(status).to.not.contain('present-changed.txt');

    assertNoUnstaged(status);
  });
});

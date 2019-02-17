'use strict';

const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');
const {
  processIo,
  processExit,
  fixtureCompare: _fixtureCompare
} = require('git-fixtures');
const { isGitClean } = require('git-diff-apply');
const boilerplateUpdate = require('../../src');
const utils = require('../../src/utils');
const buildTmp = require('../helpers/build-tmp');
const {
  assertNormalUpdate,
  assertNoUnstaged,
  assertNoStaged,
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
    dirty,
    subDir,
    startVersion = '0.0.1',
    reset,
    compareOnly,
    statsOnly,
    runCodemods,
    // listCodemods,
    createCustomDiff
  }) {
    tmpPath = buildTmp({
      fixturesPath,
      commitMessage,
      dirty,
      subDir
    });

    process.chdir(tmpPath);

    function createProject({
      options
    }) {
      return function createProject() {
        return Promise.resolve(path.resolve(__dirname, '../..', options.fixturesPath, options.projectName));
      };
    }

    return boilerplateUpdate({
      remoteUrl: 'https://github.com/kellyselden/boilerplate-update-output-repo-test',
      resolveConflicts: true,
      compareOnly,
      reset,
      statsOnly,
      runCodemods,
      // listCodemods,
      codemodsUrl: 'https://raw.githubusercontent.com/kellyselden/boilerplate-update-codemod-manifest-test/master/manifest.json',
      projectType: 'test-project',
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
      }
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
    }).catch(err => {
      return processExit({
        promise: Promise.reject(err),
        cwd: tmpPath,
        commitMessage,
        expect
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

  it('handles dirty', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/test-project',
      dirty: true
    }).then(({
      status,
      stderr
    }) => {
      expect(status).to.equal(`?? a-random-new-file
`);

      expect(stderr).to.contain('You must start with a clean working directory');
      expect(stderr).to.not.contain('UnhandledPromiseRejectionWarning');
    });
  });

  it.skip('handles non-ember-cli app', function() {
    return merge({
      fixturesPath: 'test/fixtures/package-json/non-ember-cli'
    }).then(({
      stderr
    }) => {
      expect(isGitClean({ cwd: tmpPath })).to.be.ok;

      expect(stderr).to.contain('Ember CLI project type could not be determined');
    });
  });

  it.skip('handles non-npm dir', function() {
    return merge({
      fixturesPath: 'test/fixtures/package-json/missing'
    }).then(({
      stderr
    }) => {
      expect(isGitClean({ cwd: tmpPath })).to.be.ok;

      expect(stderr).to.contain('No package.json was found in this directory');
    });
  });

  it.skip('handles malformed package.json', function() {
    return merge({
      fixturesPath: 'test/fixtures/package-json/malformed'
    }).then(({
      stderr
    }) => {
      expect(isGitClean({ cwd: tmpPath })).to.be.ok;

      expect(stderr).to.contain('The package.json is malformed');
    });
  });

  it('resets app', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/test-project',
      reset: true
    }).then(({
      status
    }) => {
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
  });

  it('opens compare url', function() {
    let opn = sandbox.stub(utils, 'opn');

    return merge({
      fixturesPath: 'test/fixtures/local/test-project',
      compareOnly: true
    }).then(({
      result,
      status
    }) => {
      assertNoUnstaged(status);

      expect(result, 'don\'t accidentally print anything to the console').to.be.undefined;

      expect(opn.calledOnce).to.be.ok;
      expect(opn.args[0][0]).to.equal('https://github.com/kellyselden/boilerplate-update-output-repo-test/compare/v0.0.1...v0.0.2');
    });
  });

  it.skip('resolves semver ranges', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/test-project',
      from: '< 0.0.2',
      to: '0.0.*',
      statsOnly: true
    }).then(({
      result
    }) => {
      expect(result).to.equal(`project type: test-project
from version: 0.0.1
to version: 0.0.2
output repo: https://github.com/kellyselden/boilerplate-update-output-repo-test
applicable codemods: commands-test-codemod`);
    });
  });

  it('shows stats only', function() {
    return merge({
      fixturesPath: 'test/fixtures/merge/test-project',
      startVersion: '0.0.2',
      statsOnly: true
    }).then(({
      result,
      status
    }) => {
      assertNoStaged(status);

      expect(result).to.equal(`project type: test-project
from version: 0.0.2
to version: 0.0.2
output repo: https://github.com/kellyselden/boilerplate-update-output-repo-test
applicable codemods: commands-test-codemod${process.env.NODE_LTS ? '' : ', script-test-codemod'}`);
    });
  });

  it.skip('lists codemods', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/test-project',
      listCodemods: true
    }).then(({
      result,
      status
    }) => {
      assertNoStaged(status);

      expect(JSON.parse(result)).to.have.own.property('commands-test-codemod');
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

  it('can create a personal diff instead of using an output repo', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/test-project',
      createCustomDiff: true
    }).then(({
      status
    }) => {
      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/test-project'
      });

      assertNoUnstaged(status);
    });
  });
});

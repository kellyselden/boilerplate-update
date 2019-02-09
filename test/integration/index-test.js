'use strict';

const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');
const {
  processExit,
  fixtureCompare: _fixtureCompare
} = require('git-fixtures');
const { isGitClean } = require('git-diff-apply');
const boilerplateUpdate = require('../../src');
const utils = require('../../src/utils');
const buildTmp = require('../helpers/build-tmp');
const {
  assertNoUnstaged,
  assertNoStaged
} = require('../helpers/assertions');

const commitMessage = 'add files';

describe('Integration - index', function() {
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
    from = '2.11.1',
    to = '3.2.0-beta.1',
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
      dirty
    });

    process.chdir(tmpPath);

    function createProject({
      options
    }) {
      return function createProject() {
        return Promise.resolve(path.resolve(__dirname, '../..', options.fixturesPath, options.projectName));
      };
    }

    let promise = boilerplateUpdate({
      remoteUrl: 'https://github.com/kellyselden/boilerplate-update-output-repo-test',
      compareOnly,
      reset,
      statsOnly,
      runCodemods,
      codemodsUrl: 'https://cdn.jsdelivr.net/gh/kellyselden/boilerplate-update-codemod-manifest-test/manifest.json',
      projectType: 'app',
      startVersion: from,
      endVersion: to,
      createCustomDiff,
      customDiffOptions: {
        projectName: 'my-custom-app',
        packageName: 'ember-cli',
        commandName: 'ember',
        createProjectFromCache: createProject,
        createProjectFromRemote: createProject,
        startOptions: {
          fixturesPath: 'test/fixtures/start'
        },
        endOptions: {
          fixturesPath: 'test/fixtures/end'
        }
      }
    }).then(({ promise }) => {
      return promise;
    });

    return processExit({
      promise,
      cwd: tmpPath,
      commitMessage,
      expect
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

  it('handles dirty', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/my-app',
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
      fixturesPath: 'test/fixtures/local/my-app',
      reset: true
    }).then(({
      status
    }) => {
      fixtureCompare({
        mergeFixtures: 'test/fixtures/end/my-app'
      });

      expect(status).to.match(/^ D app\/controllers\/application\.js$/m);

      assertNoStaged(status);
    });
  });

  it('opens compare url', function() {
    let opn = sandbox.stub(utils, 'opn');

    return merge({
      fixturesPath: 'test/fixtures/local/my-app',
      compareOnly: true
    }).then(({
      result,
      status
    }) => {
      assertNoUnstaged(status);

      expect(result, 'don\'t accidentally print anything to the console').to.be.undefined;

      expect(opn.calledOnce).to.be.ok;
      expect(opn.args[0][0]).to.equal('https://github.com/kellyselden/boilerplate-update-output-repo-test/compare/v2.11.1...v3.2.0-beta.1');
    });
  });

  it.skip('resolves semver ranges', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/my-app',
      from: '1.13',
      to: '^2',
      statsOnly: true
    }).then(({
      result
    }) => {
      expect(result).to.equal(`project type: app
from version: 1.13.15
to version: 2.18.2
output repo: https://github.com/ember-cli/ember-new-output
applicable codemods: `);
    });
  });

  it('shows stats only', function() {
    return merge({
      fixturesPath: 'test/fixtures/merge/my-app',
      from: '3.2.0-beta.1',
      statsOnly: true
    }).then(({
      result,
      status
    }) => {
      assertNoStaged(status);

      expect(result).to.equal(`project type: app
from version: 3.2.0-beta.1
to version: 3.2.0-beta.1
output repo: https://github.com/kellyselden/boilerplate-update-output-repo-test
applicable codemods: ember-modules-codemod, ember-qunit-codemod, ember-test-helpers-codemod, es5-getter-ember-codemod, qunit-dom-codemod`);
    });
  });

  it.skip('lists codemods', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/my-app',
      listCodemods: true
    }).then(({
      result,
      status
    }) => {
      assertNoStaged(status);

      expect(JSON.parse(result)).to.have.own.property('ember-modules-codemod');
    });
  });

  it('can create a personal diff instead of using an output repo', function() {
    return merge({
      fixturesPath: 'test/fixtures/local/my-custom-app',
      createCustomDiff: true
    }).then(({
      status
    }) => {
      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/my-custom-app'
      });

      assertNoUnstaged(status);
    });
  });
});

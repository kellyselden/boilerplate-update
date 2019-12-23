'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const sinon = require('sinon');
const utils = require('../../src/utils');
const getApplicableCodemods = require('../../src/get-applicable-codemods');

describe(getApplicableCodemods, function() {
  let sandbox;
  let getCodemods;
  let getNodeVersion;
  let getVersions;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    getCodemods = sandbox.stub(utils, 'getCodemods');
    getNodeVersion = sandbox.stub(utils, 'getNodeVersion');
    getVersions = sandbox.stub(utils, 'getVersions').resolves(['0.0.1', '0.0.2']);
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('works', async function() {
    getCodemods.resolves({
      testCodemod: {
        versions: {
          'test-dependency': '0.0.1'
        },
        projectOptions: ['testProjectOption'],
        nodeVersion: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      url: 'testUrl',
      json: 'testJson',
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({
      testCodemod: {
        versions: {
          'test-dependency': '0.0.1'
        },
        projectOptions: ['testProjectOption'],
        nodeVersion: '4.0.0'
      }
    });

    expect(getCodemods.args).to.deep.equal([['testUrl', 'testJson']]);

    expect(getVersions.args).to.deep.equal([['test-dependency']]);
  });

  it('excludes wrong option', async function() {
    getCodemods.resolves({
      testCodemod: {
        versions: {
          'test-dependency': '0.0.1'
        },
        projectOptions: ['testProjectOption2'],
        nodeVersion: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption1'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  });

  it('excludes wrong version', async function() {
    getCodemods.resolves({
      testCodemod: {
        versions: {
          'test-dependency': '0.0.2'
        },
        projectOptions: ['testProjectOption'],
        nodeVersion: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  });

  it('excludes wrong node version', async function() {
    getCodemods.resolves({
      testCodemod: {
        versions: {
          'test-dependency': '0.0.1'
        },
        projectOptions: ['testProjectOption'],
        nodeVersion: '6.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  });

  it('excludes codemod with unsatisfied dependency', async function() {
    getCodemods.resolves({
      testCodemod: {
        versions: {
          'test-dependency': '0.0.2'
        },
        projectOptions: ['testProjectOption'],
        nodeVersion: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'just-another-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  });

  it('uses minimal applicable version for empty constraint', async function() {
    const actualCodeMods = {
      testCodemod: {
        versions: {
          'test-dependency': '0.0.1'
        },
        projectOptions: ['testProjectOption'],
        nodeVersion: '4.0.0'
      }
    };

    getCodemods.resolves(actualCodeMods);

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': ''
        }
      }
    });

    expect(codemods).to.deep.equal(actualCodeMods);
  });
});

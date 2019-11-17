'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const sinon = require('sinon');
const utils = require('../../src/utils');
const getApplicableCodemods = require('../../src/get-applicable-codemods');

describe(getApplicableCodemods, function() {
  let sandbox;
  let downloadCodemods;
  let getNodeVersion;
  let getVersions;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    downloadCodemods = sandbox.stub(utils, 'downloadCodemods');
    getNodeVersion = sandbox.stub(utils, 'getNodeVersion');
    getVersions = sandbox.stub(utils, 'getVersions').resolves(['0.0.1', '0.0.2']);
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('works', async function() {
    downloadCodemods.resolves({
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

    expect(downloadCodemods.args).to.deep.equal([['testUrl']]);

    expect(getVersions.args).to.deep.equal([['test-dependency']]);
  });

  it('excludes wrong option', async function() {
    downloadCodemods.resolves({
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
    downloadCodemods.resolves({
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
    downloadCodemods.resolves({
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
});

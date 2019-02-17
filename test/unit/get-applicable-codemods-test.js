'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const co = require('co');
const utils = require('../../src/utils');
const getApplicableCodemods = require('../../src/get-applicable-codemods');

describe('Unit - getApplicableCodemods', function() {
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

  it('works', co.wrap(function*() {
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

    let codemods = yield getApplicableCodemods({
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

    expect(getCodemods.args).to.deep.equal([['testUrl']]);

    expect(getVersions.args).to.deep.equal([['test-dependency']]);
  }));

  it('excludes wrong option', co.wrap(function*() {
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

    let codemods = yield getApplicableCodemods({
      projectOptions: ['testProjectOption1'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  }));

  it('excludes wrong version', co.wrap(function*() {
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

    let codemods = yield getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  }));

  it('excludes wrong node version', co.wrap(function*() {
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

    let codemods = yield getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  }));
});

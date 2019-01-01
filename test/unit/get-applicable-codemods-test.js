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

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    getCodemods = sandbox.stub(utils, 'getCodemods');
    getNodeVersion = sandbox.stub(utils, 'getNodeVersion');
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('works', co.wrap(function*() {
    getCodemods.resolves({
      testCodemod: {
        version: '0.0.1',
        projectTypes: ['testProjectType'],
        nodeVersion: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = yield getApplicableCodemods({
      url: 'testUrl',
      projectType: 'testProjectType',
      startVersion: '0.0.1'
    });

    expect(codemods).to.deep.equal({
      testCodemod: {
        version: '0.0.1',
        projectTypes: ['testProjectType'],
        nodeVersion: '4.0.0'
      }
    });

    expect(getCodemods.args).to.deep.equal([['testUrl']]);
  }));

  it('excludes wrong type', co.wrap(function*() {
    getCodemods.resolves({
      testCodemod: {
        version: '0.0.1',
        projectTypes: ['testProjectType2'],
        nodeVersion: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = yield getApplicableCodemods({
      projectType: 'testProjectType1',
      startVersion: '0.0.1'
    });

    expect(codemods).to.deep.equal({});
  }));

  it('excludes wrong version', co.wrap(function*() {
    getCodemods.resolves({
      testCodemod: {
        version: '0.0.2',
        projectTypes: ['testProjectType'],
        nodeVersion: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = yield getApplicableCodemods({
      projectType: 'testProjectType',
      startVersion: '0.0.1'
    });

    expect(codemods).to.deep.equal({});
  }));

  it('excludes wrong node version', co.wrap(function*() {
    getCodemods.resolves({
      testCodemod: {
        version: '0.0.1',
        projectTypes: ['testProjectType'],
        nodeVersion: '6.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = yield getApplicableCodemods({
      projectType: 'testProjectType',
      startVersion: '0.0.1'
    });

    expect(codemods).to.deep.equal({});
  }));
});

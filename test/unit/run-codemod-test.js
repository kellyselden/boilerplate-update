'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const co = require('co');
const utils = require('../../src/utils');
const runCodemod = require('../../src/run-codemod');

describe('Unit - runCodemod', function() {
  let sandbox;
  let npx;
  let runScript;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    npx = sandbox.stub(utils, 'npx').resolves();
    runScript = sandbox.stub(utils, 'runScript').resolves();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('runs a command', co.wrap(function*() {
    yield runCodemod({
      commands: [
        'test command'
      ]
    });

    expect(npx.args).to.deep.equal([
      ['test command']
    ]);
    expect(runScript.called).to.be.false;
  }));

  it('runs multiple commands sequentially', co.wrap(function*() {
    let npx1 = npx.withArgs('test command 1').callsFake(co.wrap(() => {
      expect(npx2.args).to.deep.equal([]);
    }));
    let npx2 = npx.withArgs('test command 2').callsFake(co.wrap(() => {
      expect(npx1.args).to.deep.equal([['test command 1']]);
    }));

    yield runCodemod({
      commands: [
        'test command 1',
        'test command 2'
      ]
    });

    expect(npx.args).to.deep.equal([
      ['test command 1'],
      ['test command 2']
    ]);
  }));

  it('continues if one codemod errors', co.wrap(function*() {
    npx.withArgs('test command 1').rejects();
    let npx2 = npx.withArgs('test command 2').resolves();

    yield runCodemod({
      commands: [
        'test command 1',
        'test command 2'
      ]
    });

    expect(npx2.calledOnce).to.be.ok;
  }));

  it('runs a script', co.wrap(function*() {
    yield runCodemod({
      script: 'test script'
    });

    expect(runScript.args).to.deep.equal([['test script']]);
    expect(npx.called).to.be.false;
  }));
});

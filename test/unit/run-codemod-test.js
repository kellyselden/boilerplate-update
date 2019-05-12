'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const sinon = require('sinon');
const utils = require('../../src/utils');
const runCodemod = require('../../src/run-codemod');

describe(runCodemod, function() {
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

  it('runs a command', async function() {
    await runCodemod({
      commands: [
        'test command'
      ]
    });

    expect(npx.args).to.deep.equal([
      ['test command']
    ]);
    expect(runScript.called).to.be.false;
  });

  it('runs multiple commands sequentially', async function() {
    let npx1 = npx.withArgs('test command 1').callsFake(async() => {
      expect(npx2.args).to.deep.equal([]);
    });
    let npx2 = npx.withArgs('test command 2').callsFake(async() => {
      expect(npx1.args).to.deep.equal([['test command 1']]);
    });

    await runCodemod({
      commands: [
        'test command 1',
        'test command 2'
      ]
    });

    expect(npx.args).to.deep.equal([
      ['test command 1'],
      ['test command 2']
    ]);
  });

  it('continues if one codemod errors', async function() {
    npx.withArgs('test command 1').rejects();
    let npx2 = npx.withArgs('test command 2').resolves();

    await runCodemod({
      commands: [
        'test command 1',
        'test command 2'
      ]
    });

    expect(npx2.calledOnce).to.be.ok;
  });

  it('runs a script', async function() {
    await runCodemod({
      script: 'test script'
    });

    expect(runScript.args).to.deep.equal([['test script']]);
    expect(npx.called).to.be.false;
  });
});

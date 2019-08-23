'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const sinon = require('sinon');
const utils = require('../../src/utils');
const runCodemods = require('../../src/run-codemods');

describe(runCodemods, function() {
  let sandbox;
  let runCodemod;
  let run;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    runCodemod = sandbox.stub(utils, 'runCodemod').resolves();
    run = sandbox.stub(utils, 'run').resolves();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('works', async function() {
    await runCodemods({
      testCodemod: {
        commands: [
          'test command'
        ]
      }
    });

    expect(runCodemod.args).to.deep.equal([['testCodemod', {
      commands: [
        'test command'
      ]
    }]]);

    expect(run.calledOnce, 'stages files').to.be.ok;
  });

  it('runs multiple commands sequentially', async function() {
    let testCodemod1 = {
      commands: [
        'test command 1'
      ]
    };
    let testCodemod2 = {
      commands: [
        'test command 2'
      ]
    };

    let runCodemod1 = runCodemod.withArgs(testCodemod1).callsFake(async() => {
      expect(runCodemod2.args).to.deep.equal([]);
    });
    let runCodemod2 = runCodemod.withArgs(testCodemod2).callsFake(async() => {
      expect(runCodemod1.args).to.deep.equal([['testCodemod1', testCodemod1]]);
    });

    await runCodemods({
      testCodemod1,
      testCodemod2
    });

    expect(runCodemod.args).to.deep.equal([
      ['testCodemod1', testCodemod1],
      ['testCodemod2', testCodemod2]
    ]);
  });
});

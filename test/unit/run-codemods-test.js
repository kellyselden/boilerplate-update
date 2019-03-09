'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const co = require('co');
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

  it('works', co.wrap(function*() {
    yield runCodemods({
      testCodemod: {
        commands: [
          'test command'
        ]
      }
    });

    expect(runCodemod.args).to.deep.equal([[{
      commands: [
        'test command'
      ]
    }]]);

    expect(run.calledOnce, 'stages files').to.be.ok;
  }));

  it('runs multiple commands sequentially', co.wrap(function*() {
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

    let runCodemod1 = runCodemod.withArgs(testCodemod1).callsFake(co.wrap(() => {
      expect(runCodemod2.args).to.deep.equal([]);
    }));
    let runCodemod2 = runCodemod.withArgs(testCodemod2).callsFake(co.wrap(() => {
      expect(runCodemod1.args).to.deep.equal([[testCodemod1]]);
    }));

    yield runCodemods({
      testCodemod1,
      testCodemod2
    });

    expect(runCodemod.args).to.deep.equal([
      [testCodemod1],
      [testCodemod2]
    ]);
  }));
});

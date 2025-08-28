'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const utils = require('../../src/utils');
const runCodemods = require('../../src/run-codemods');

describe(runCodemods, function({ sinon }) {
  let runCodemod;
  let run;

  beforeEach(function() {
    runCodemod = sinon.stub(utils, 'runCodemod').resolves();
    run = sinon.stub(utils, 'run').resolves();
  });

  it('works', async function() {
    await runCodemods({
      testCodemod: {
        commands: [
          'test command',
        ],
      },
    }, '/test/cwd');

    expect(runCodemod.args).to.deep.equal([[{
      commands: [
        'test command',
      ],
    }, '/test/cwd']]);

    expect(run.calledOnce, 'stages files').to.be.ok;
  });

  it('runs multiple commands sequentially', async function() {
    let testCodemod1 = {
      commands: [
        'test command 1',
      ],
    };
    let testCodemod2 = {
      commands: [
        'test command 2',
      ],
    };

    let runCodemod1 = runCodemod.withArgs(testCodemod1).callsFake(async() => {
      expect(runCodemod2.args).to.deep.equal([]);
    });
    let runCodemod2 = runCodemod.withArgs(testCodemod2).callsFake(async() => {
      expect(runCodemod1.args).to.deep.equal([[testCodemod1, '/test/cwd']]);
    });

    await runCodemods({
      testCodemod1,
      testCodemod2,
    }, '/test/cwd');

    expect(runCodemod.args).to.deep.equal([
      [testCodemod1, '/test/cwd'],
      [testCodemod2, '/test/cwd'],
    ]);
  });
});

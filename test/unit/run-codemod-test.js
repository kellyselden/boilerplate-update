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
  let log;
  let error;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    npx = sandbox.stub(utils, 'npx').resolves();
    runScript = sandbox.stub(utils, 'runScript').resolves();
    log = sandbox.stub(console, 'log');
    error = sandbox.stub(console, 'error');
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('command', function() {
    it('runs a command', async function() {
      await runCodemod('test-codemod', {
        commands: [
          'test command'
        ]
      });

      expect(npx.args).to.deep.equal([
        ['test command']
      ]);
      expect(runScript).to.not.be.called;

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(log.withArgs('Running command 1 of 1')).to.be.called;
      expect(log.withArgs('Finished running command 1 of 1')).to.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.be.called;
    });

    it('runs multiple commands sequentially', async function() {
      let npx1 = npx.withArgs('test command 1').callsFake(async() => {
        expect(npx2.args).to.deep.equal([]);
      });
      let npx2 = npx.withArgs('test command 2').callsFake(async() => {
        expect(npx1.args).to.deep.equal([['test command 1']]);
      });

      await runCodemod('test-codemod', {
        commands: [
          'test command 1',
          'test command 2'
        ]
      });

      expect(npx.args).to.deep.equal([
        ['test command 1'],
        ['test command 2']
      ]);

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(log.withArgs('Running command 1 of 2')).to.be.called;
      expect(log.withArgs('Finished running command 1 of 2')).to.be.called;
      expect(log.withArgs('Running command 2 of 2')).to.be.called;
      expect(log.withArgs('Finished running command 2 of 2')).to.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.be.called;
    });

    it('stops if one command errors', async function() {
      npx.withArgs('test command 1').rejects();

      await runCodemod('test-codemod', {
        commands: [
          'test command 1',
          'test command 2'
        ]
      });

      expect(npx.withArgs('test command 2')).to.not.be.called;

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(log.withArgs('Running command 1 of 2')).to.be.called;
      expect(error.withArgs('Error running command test command 1')).to.be.called;
      expect(log.withArgs('Finished running command 1 of 2')).to.not.be.called;
      expect(log.withArgs('Running command 2 of 2')).to.not.be.called;
      expect(log.withArgs('Finished running command 2 of 2')).to.not.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.not.be.called;
    });
  });

  describe('script', function() {
    it('runs a script', async function() {
      await runCodemod('test-codemod', {
        script: 'test script'
      });

      expect(runScript.args).to.deep.equal([['test script']]);
      expect(npx).to.not.be.called;

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.be.called;
    });

    it('doesn\'t throw if error', async function() {
      runScript.rejects();

      await runCodemod('test-codemod', {
        script: 'test script'
      });

      expect(runScript.args).to.deep.equal([['test script']]);
      expect(npx).to.not.be.called;

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(error.withArgs('Error running script test script')).to.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.not.be.called;
    });
  });
});

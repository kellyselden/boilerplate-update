'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const utils = require('../../src/utils');
const runCodemod = require('../../src/run-codemod');

describe(runCodemod, function({ sinon }) {
  let npx;
  let runScript;
  let log;
  let error;

  beforeEach(function() {
    npx = sinon.stub(utils, 'npx').resolves();
    runScript = sinon.stub(utils, 'runScript').resolves();
    log = sinon.stub(console, 'log');
    error = sinon.stub(console, 'error');
  });

  describe('command', function() {
    it('runs a command', async function() {
      await runCodemod({
        name: 'test-codemod',
        commands: [
          'test command'
        ]
      }, '/test/cwd');

      expect(npx.args).to.deep.equal([
        ['test command', { cwd: '/test/cwd' }]
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
        expect(npx1.args).to.deep.equal([['test command 1', { cwd: '/test/cwd' }]]);
      });

      await runCodemod({
        name: 'test-codemod',
        commands: [
          'test command 1',
          'test command 2'
        ]
      }, '/test/cwd');

      expect(npx.args).to.deep.equal([
        ['test command 1', { cwd: '/test/cwd' }],
        ['test command 2', { cwd: '/test/cwd' }]
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

      await runCodemod({
        name: 'test-codemod',
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
      await runCodemod({
        name: 'test-codemod',
        script: 'test script'
      }, '/test/cwd');

      expect(runScript.args).to.deep.equal([['test script', '/test/cwd']]);
      expect(npx).to.not.be.called;

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.be.called;
    });

    it('doesn\'t throw if error', async function() {
      runScript.rejects(new Error('test error'));

      await runCodemod({
        name: 'test-codemod',
        script: 'test script'
      }, '/test/cwd');

      expect(runScript.args).to.deep.equal([['test script', '/test/cwd']]);
      expect(npx).to.not.be.called;

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(error.withArgs('Error running script test script')).to.be.called;
      expect(error.withArgs(sinon.match('Error: test error'))).to.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.not.be.called;
    });
  });
});

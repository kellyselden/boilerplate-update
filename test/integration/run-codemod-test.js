'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const sinon = require('sinon');
const runCodemod = require('../../src/run-codemod');

describe(runCodemod, function() {
  let sandbox;
  let log;
  let error;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    log = sandbox.stub(console, 'log');
    error = sandbox.stub(console, 'error');
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('command', function() {
    it('handles thrown error', async function() {
      let codemod = {
        name: 'test-codemod',
        commands: [
          'node -e "throw new Error(\'test error\')"'
        ]
      };

      await runCodemod(codemod);

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(log.withArgs('Running command 1 of 1')).to.be.called;
      expect(error.withArgs('Error running command node -e "throw new Error(\'test error\')"')).to.be.called;
      expect(log.withArgs('Finished running command 1 of 1')).to.not.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.not.be.called;
    });

    it('handles node error code', async function() {
      let codemod = {
        name: 'test-codemod',
        commands: [
          'node -e "process.exit(1)"'
        ]
      };

      await runCodemod(codemod);

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(log.withArgs('Running command 1 of 1')).to.be.called;
      expect(error.withArgs('Error running command node -e "process.exit(1)"')).to.be.called;
      expect(log.withArgs('Finished running command 1 of 1')).to.not.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.not.be.called;
    });

    // needs `shell: true`
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('handles shell error code', async function() {
      let codemod = {
        name: 'test-codemod',
        commands: [
          '-c "exit 1"'
        ]
      };

      await runCodemod(codemod);

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(log.withArgs('Running command 1 of 1')).to.be.called;
      expect(error.withArgs('Error running command -c "exit 1"')).to.be.called;
      expect(log.withArgs('Finished running command 1 of 1')).to.not.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.not.be.called;
    });
  });

  describe('script', function() {
    it('handles thrown error', async function() {
      let codemod = {
        name: 'test-codemod',
        script: 'throw new Error(\'test error\')'
      };

      await runCodemod(codemod);

      expect(log.withArgs('Running codemod test-codemod')).to.be.called;
      expect(error.withArgs('Error running script throw new Error(\'test error\')')).to.be.called;
      expect(log.withArgs('Finished running codemod test-codemod')).to.not.be.called;
    });
  });
});

'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const runScript = require('../../src/run-script');

describe(runScript, function() {
  it('runs script', async function() {
    let script = 'return 3 + 4';

    let result = await runScript(script);

    expect(result).to.equal(7);
  });

  it('scopes tmp cwd', async function() {
    let script = 'return cwd';

    let result = await runScript(script);

    expect(result).to.startWith(require('os').tmpdir());
    expect(result).to.not.equal(process.cwd());
  });

  it('scopes require', async function() {
    let script = 'return require';

    let result = await runScript(script);

    expect(result.name).to.equal('require');
  });
});

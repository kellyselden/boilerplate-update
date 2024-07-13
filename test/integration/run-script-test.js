'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const runScript = require('../../src/run-script');
const { createTmpDir } = require('../../src/tmp');
const fs = require('fs-extra');

describe(runScript, function() {
  let tmpDir;

  before(async function() {
    tmpDir = await createTmpDir();
  });

  it('runs script', async function() {
    let script = 'return 3 + 4';

    let result = await runScript(script, tmpDir);

    expect(result).to.equal(7);
  });

  it('uses cwd', async function() {
    let cwd = process.cwd();

    let script = 'return process.cwd()';

    let result = await runScript(script, tmpDir);

    expect(result).to.equal(await fs.realpath(tmpDir));
    expect(process.cwd()).to.equal(cwd);
  });

  it('scopes tmp cwd', async function() {
    let script = 'return cwd';

    let result = await runScript(script, tmpDir);

    expect(result).to.startWith(require('os').tmpdir());
    expect(result).to.not.equal(process.cwd());
  });

  it('scopes require', async function() {
    let script = 'return require';

    let result = await runScript(script, tmpDir);

    expect(result.name).to.equal('require');
  });

  it('scopes execa', async function() {
    let { execa } = await import('execa');

    let script = 'return execa';

    let result = await runScript(script, tmpDir);

    expect(result.name).to.equal(execa.name);
  });

  it('allows awaiting', async function() {
    let script = 'return await 3 + 4';

    let result = await runScript(script, tmpDir);

    expect(result).to.equal(7);
  });
});

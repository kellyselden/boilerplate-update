'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getPackageJson = require('../../src/get-package-json');

describe(getPackageJson, function() {
  let cwd;

  beforeEach(function() {
    cwd = process.cwd();
  });

  afterEach(function() {
    process.chdir(cwd);
  });

  it('throws if no package.json', async function() {
    process.chdir('test/fixtures/package-json/missing/test-project');

    await expect(getPackageJson())
      .to.be.rejectedWith('No package.json was found in this directory');
  });

  it('throws if malformed package.json', async function() {
    process.chdir('test/fixtures/package-json/malformed/test-project');

    await expect(getPackageJson())
      .to.be.rejectedWith('The package.json is malformed');
  });

  it('loads package.json', async function() {
    process.chdir('test/fixtures/package-json/valid/test-project');

    await expect(getPackageJson())
      .to.eventually.deep.equal({});
  });
});

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const co = require('co');
const getPackageJson = require('../../src/get-package-json');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('Integration - getPackageJson', function() {
  let cwd;

  beforeEach(function() {
    cwd = process.cwd();
  });

  afterEach(function() {
    process.chdir(cwd);
  });

  it('throws if no package.json', co.wrap(function*() {
    process.chdir('test/fixtures/package-json/missing');

    yield expect(getPackageJson())
      .to.be.rejectedWith('No package.json was found in this directory');
  }));

  it('throws if malformed package.json', co.wrap(function*() {
    process.chdir('test/fixtures/package-json/malformed');

    yield expect(getPackageJson())
      .to.be.rejectedWith('The package.json is malformed');
  }));

  it('loads package.json', co.wrap(function*() {
    process.chdir('test/fixtures/package-json/valid');

    yield expect(getPackageJson())
      .to.eventually.deep.equal({});
  }));
});

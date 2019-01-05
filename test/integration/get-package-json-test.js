'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const co = require('co');
const getPackageJson = require('../../src/get-package-json');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('Integration - getPackageJson', function() {
  it('throws if no package.json', co.wrap(function*() {
    yield expect(
      getPackageJson('test/fixtures/package-json/missing')
    ).to.be.rejectedWith('No package.json was found in this directory');
  }));

  it('throws if malformed package.json', co.wrap(function*() {
    yield expect(
      getPackageJson('test/fixtures/package-json/malformed')
    ).to.be.rejectedWith('The package.json is malformed');
  }));

  it('loads package.json', co.wrap(function*() {
    yield expect(
      getPackageJson('test/fixtures/package-json/valid')
    ).to.eventually.deep.equal({});
  }));
});

'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const co = require('co');
const getCodemods = require('../../src/get-codemods');

const url = 'https://cdn.jsdelivr.net/gh/kellyselden/boilerplate-update/test/fixtures/codemod-manifest.json';

describe(getCodemods, function() {
  this.timeout(5 * 1000);

  it('gets codemods', co.wrap(function*() {
    let codemods = yield getCodemods(url);

    expect(codemods).to.be.an.instanceof(Object);
  }));
});

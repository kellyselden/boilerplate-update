'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getCodemods = require('../../src/get-codemods');

const url = 'https://cdn.jsdelivr.net/gh/kellyselden/boilerplate-update/test/fixtures/codemod-manifest.json';

describe(getCodemods, function() {
  this.timeout(5 * 1000);

  it('gets codemods', async function() {
    let codemods = await getCodemods(url);

    expect(codemods).to.be.an.instanceof(Object);
  });
});

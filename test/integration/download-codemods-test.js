'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const downloadCodemods = require('../../src/download-codemods');

const url = 'https://cdn.jsdelivr.net/gh/kellyselden/boilerplate-update/test/fixtures/codemod-manifest.json';

describe(downloadCodemods, function() {
  this.timeout(5 * 1000);

  it('downloads codemods', async function() {
    let codemods = await downloadCodemods(url);

    expect(codemods).to.be.an.instanceof(Object);
  });
});

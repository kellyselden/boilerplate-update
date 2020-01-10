'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const downloadCodemods = require('../../src/download-codemods');

const url = 'git+ssh://git@github.com/kellyselden/boilerplate-update-codemod-manifest-test.git#semver:*';

describe(downloadCodemods, function() {
  this.timeout(5 * 1000);

  it('downloads codemods', async function() {
    let codemods = await downloadCodemods(url);

    expect(Object.keys(codemods)).to.have.lengthOf.above(0);
  });
});

'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getVersions = require('../../src/get-versions');

describe(getVersions, function() {
  it('works', async function() {
    let versions = await getVersions('lodash');

    expect(versions).to.include('0.5.0-rc.1');
  });
});

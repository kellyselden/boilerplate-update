'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getTagVersion = require('../../src/get-tag-version');

describe(getTagVersion, function() {
  it('resolves dist-tags', async function() {
    let version = await getTagVersion({
      range: 'legacy',
      packageName: 'webpack',
      distTags: ['legacy'],
    });

    expect(version).to.be.semver();
  });
});

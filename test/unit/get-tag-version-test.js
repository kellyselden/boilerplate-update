'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getTagVersion = require('../../src/get-tag-version');
const sinon = require('sinon');
const npm = require('../../src/npm');

describe(getTagVersion, function() {
  let npmJsonStub;

  beforeEach(function() {
    npmJsonStub = sinon.stub(npm, 'json');
  });

  afterEach(function() {
    sinon.restore();
  });

  it('allows version override', async function() {
    expect(await getTagVersion({ range: '2.13.1' })).to.equal('2.13.1');
  });

  it('allows semver hints', async function() {
    expect(await getTagVersion({
      range: '~2.12',
      versions: [
        '2.12.0',
        '2.12.1'
      ]
    })).to.equal('2.12.1');
  });

  it('resolves dist-tags', async function() {
    npmJsonStub.withArgs('view', 'foo@bar', 'version').resolves('2.14.0');

    expect(await getTagVersion({
      range: 'bar',
      packageName: 'foo',
      distTags: ['bar']
    })).to.equal('2.14.0');

    expect(npmJsonStub).to.be.calledOnce;
  });
});

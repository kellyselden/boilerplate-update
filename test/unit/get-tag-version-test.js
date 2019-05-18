'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getTagVersion = require('../../src/get-tag-version');
const sinon = require('sinon');
const npm = require('../../src/npm');

describe(getTagVersion, function() {
  let sandbox;
  let npmJsonStub;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    npmJsonStub = sandbox.stub(npm, 'json');
  });

  afterEach(function() {
    sandbox.restore();
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
    npmJsonStub.withArgs(sinon.match('foo@bar')).resolves('2.14.0');

    expect(await getTagVersion({
      range: 'bar',
      packageName: 'foo',
      distTags: ['bar']
    })).to.equal('2.14.0');

    expect(npmJsonStub.calledOnce).to.be.ok;
  });
});

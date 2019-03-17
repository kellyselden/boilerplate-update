'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getTagVersion = require('../../src/get-tag-version');
const sinon = require('sinon');
const co = require('co');
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

  it('allows version override', co.wrap(function*() {
    expect(yield getTagVersion({ range: '2.13.1' })).to.equal('2.13.1');
  }));

  it('allows semver hints', co.wrap(function*() {
    expect(yield getTagVersion({
      range: '~2.12',
      versions: [
        '2.12.0',
        '2.12.1'
      ]
    })).to.equal('2.12.1');
  }));

  it('resolves dist-tags', co.wrap(function*() {
    npmJsonStub.withArgs(sinon.match('foo@bar')).resolves('2.14.0');

    expect(yield getTagVersion({
      range: 'bar',
      packageName: 'foo',
      distTags: ['bar']
    })).to.equal('2.14.0');

    expect(npmJsonStub.calledOnce).to.be.ok;
  }));
});

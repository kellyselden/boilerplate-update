'use strict';

const { expect } = require('chai');
const getTagVersion = require('../../src/get-tag-version');
const sinon = require('sinon');
const co = require('co');
const utils = require('../../src/utils');

describe('Unit - getTagVersion', function() {
  let sandbox;
  let runStub;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    runStub = sandbox.stub(utils, 'run').resolves('"2.14.0"');
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
    runStub.withArgs(sinon.match('foo@bar')).resolves('"2.14.0"');

    expect(yield getTagVersion({
      range: 'bar',
      packageName: 'foo',
      distTags: ['bar']
    })).to.equal('2.14.0');

    expect(runStub.calledOnce).to.be.ok;
  }));
});

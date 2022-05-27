'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getTimes = require('../../src/get-times');
const sinon = require('sinon');
const npm = require('../../src/npm');

describe(getTimes, function() {
  let npmJsonStub;

  beforeEach(function() {
    npmJsonStub = sinon.stub(npm, 'json');
  });

  afterEach(function() {
    sinon.restore();
  });

  it('allows semver hints', async function() {
    npmJsonStub.withArgs('view', 'foo', 'time').resolves({
      'bar': 'baz'
    });

    let times = await getTimes('foo');

    expect(times).to.have.property('bar', 'baz');

    expect(npmJsonStub).to.be.calledOnce;
  });

  it('removes created and modified', async function() {
    npmJsonStub.withArgs('view', 'foo', 'time').resolves({
      'modified': '',
      'created': ''
    });

    let times = await getTimes('foo');

    expect(times).to.not.have.property('modified');
    expect(times).to.not.have.property('created');

    expect(npmJsonStub).to.be.calledOnce;
  });
});

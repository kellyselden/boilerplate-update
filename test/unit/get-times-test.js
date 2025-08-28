'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getTimes = require('../../src/get-times');
const pacote = require('pacote');

describe(getTimes, function({ sinon }) {
  let pacotePackumentStub;

  beforeEach(function() {
    pacotePackumentStub = sinon.stub(pacote, 'packument');
  });

  it('allows semver hints', async function() {
    pacotePackumentStub.withArgs('foo', { fullMetadata: true }).resolves({
      time: {
        'bar': 'baz',
      },
    });

    let times = await getTimes('foo');

    expect(times).to.have.property('bar', 'baz');

    expect(pacotePackumentStub).to.be.calledOnce;
  });

  it('removes created and modified', async function() {
    pacotePackumentStub.withArgs('foo', { fullMetadata: true }).resolves({
      time: {
        'modified': '',
        'created': '',
      },
    });

    let times = await getTimes('foo');

    expect(times).to.not.have.property('modified');
    expect(times).to.not.have.property('created');

    expect(pacotePackumentStub).to.be.calledOnce;
  });
});

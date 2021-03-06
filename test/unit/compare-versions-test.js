'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const sinon = require('sinon');
const compareVersions = require('../../src/compare-versions');
const utils = require('../../src/utils');

describe(compareVersions, function() {
  let open;

  beforeEach(function() {
    open = sinon.stub(utils, 'open');
  });

  afterEach(function() {
    sinon.restore();
  });

  it('works', function() {
    compareVersions({
      remoteUrl: 'test-url',
      startTag: 'v2.18.2',
      endTag: 'v3.0.2'
    });

    expect(open.calledOnce).to.be.ok;
    expect(open.args[0][0]).to.equal('test-url/compare/v2.18.2...v3.0.2');
  });
});

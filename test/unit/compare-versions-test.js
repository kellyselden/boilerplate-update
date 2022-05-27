'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const compareVersions = require('../../src/compare-versions');
const utils = require('../../src/utils');

describe(compareVersions, function({ sinon }) {
  let open;

  beforeEach(function() {
    open = sinon.stub(utils, 'open');
  });

  it('works', function() {
    compareVersions({
      remoteUrl: 'test-url',
      startTag: 'v2.18.2',
      endTag: 'v3.0.2'
    });

    expect(open).to.be.calledOnce;
    expect(open.args[0][0]).to.equal('test-url/compare/v2.18.2...v3.0.2');
  });
});

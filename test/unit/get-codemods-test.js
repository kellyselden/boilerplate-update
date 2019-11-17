'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getCodemods = require('../../src/get-codemods');
const sinon = require('sinon');
const utils = require('../../src/utils');

describe(getCodemods, function() {
  afterEach(function() {
    sinon.restore();
  });

  it('gets codemods via url', async function() {
    let expected = { testCodemod: '' };

    let json = JSON.stringify(expected);

    let url = 'testUrl';

    let downloadCodemods = sinon.stub(utils, 'downloadCodemods')
      .withArgs(url).resolves(json);

    let actual = await getCodemods(url);

    expect(actual).to.deep.equal(expected);

    expect(downloadCodemods).to.be.calledOnce;
  });

  it('gets codemods via json', async function() {
    let expected = { testCodemod: '' };

    let json = JSON.stringify(expected);

    let actual = await getCodemods(null, json);

    expect(actual).to.deep.equal(expected);
  });
});

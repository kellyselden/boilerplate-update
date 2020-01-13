'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const downloadCodemods = require('../../src/download-codemods');
const sinon = require('sinon');

const url = 'git+ssh://git@github.com/kellyselden/boilerplate-update-codemod-manifest-test.git#semver:*';

describe(downloadCodemods, function() {
  this.timeout(5 * 1000);

  afterEach(function() {
    sinon.restore();
  });

  it('downloads codemods', async function() {
    let codemods = await downloadCodemods(url);

    expect(Object.keys(codemods)).to.have.lengthOf.above(0);
  });

  it('detects old git semver', async function() {
    sinon.stub(downloadCodemods, 'requireManifest').returns({ foo: 'bar' });
    let warn = sinon.stub(console, 'warn');

    let codemods = await downloadCodemods('git+ssh://git@github.com/left-pad/left-pad.git#semver:1.2.0');

    expect(warn.withArgs('There is a new version of the codemods manifest.')).to.be.calledOnce;

    expect(codemods).to.deep.equal({ foo: 'bar' });
  });

  it('detects old npm semver', async function() {
    sinon.stub(downloadCodemods, 'requireManifest').returns({ foo: 'bar' });
    let warn = sinon.stub(console, 'warn');

    let codemods = await downloadCodemods('left-pad@1.2.0');

    expect(warn.withArgs('There is a new version of the codemods manifest.')).to.be.calledOnce;

    expect(codemods).to.deep.equal({ foo: 'bar' });
  });
});

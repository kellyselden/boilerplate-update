'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const downloadCodemods = require('../../src/download-codemods');
const sinon = require('sinon');

describe(downloadCodemods, function() {
  this.timeout(5e3);

  it('downloads codemods', async function() {
    let source = 'git+ssh://git@github.com/kellyselden/boilerplate-update-codemod-manifest-test.git#semver:*';

    let codemods = await downloadCodemods(source);

    expect(Object.keys(codemods)).to.have.lengthOf.above(0);
  });

  it('supports direct file download', async function() {
    let source = 'https://cdn.jsdelivr.net/gh/kellyselden/boilerplate-update-codemod-manifest-test/manifest.json';

    let codemods = await downloadCodemods(source);

    expect(Object.keys(codemods)).to.have.lengthOf.above(0);
  });

  describe('detects old', function() {
    beforeEach(function() {
      sinon.stub(downloadCodemods, 'requireManifest').returns({ foo: 'bar' });
      this.warn = sinon.stub(console, 'warn');
    });

    afterEach(function() {
      expect(this.codemods).to.deep.equal({ foo: 'bar' });

      sinon.restore();
    });

    it('git semver', async function() {
      let source = 'git+ssh://git@github.com/left-pad/left-pad.git#semver:1.2.0';

      this.codemods = await downloadCodemods(source);

      expect(this.warn.withArgs('There is a new version of the codemods manifest.')).to.be.calledOnce;
    });

    it('npm semver', async function() {
      let source = 'left-pad@1.2.0';

      this.codemods = await downloadCodemods(source);

      expect(this.warn.withArgs('There is a new version of the codemods manifest.')).to.be.calledOnce;
    });
  });
});

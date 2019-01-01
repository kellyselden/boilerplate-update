'use strict';

const { expect } = require('chai');
const getCodemods = require('../../src/get-codemods');

const url = 'https://rawgit.com/ember-cli/ember-cli-update-codemods-manifest/v2/manifest.json';

describe('Integration - getCodemods', function() {
  this.timeout(5 * 1000);

  it('gets codemods', function() {
    return getCodemods(url).then(codemods => {
      expect(codemods).to.be.an.instanceof(Object);
    });
  });
});

'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const npm = require('../../src/npm');

describe(function() {
  this.timeout(5 * 1000);

  describe(npm, function() {
    it('works', async function() {
      let result = await npm('install', '-h');

      expect(result).to.include('isntal');
    });
  });

  describe(npm.json, function() {
    it('works', async function() {
      let result = await npm.json('v', 'lodash');

      expect(result.name).to.equal('lodash');
    });
  });
});

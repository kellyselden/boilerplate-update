'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getProjectVersion = require('../../src/get-project-version');

describe(getProjectVersion, function() {
  it('works', function() {
    expect(getProjectVersion(
      '2.11.1',
      [
        '2.11.0',
        '2.11.1',
        '2.11.2',
      ],
    )).to.equal('2.11.1');
    expect(getProjectVersion(
      '2.12',
      [
        '2.12.0',
        '2.12.1',
      ],
    )).to.equal('2.12.0');
  });
});

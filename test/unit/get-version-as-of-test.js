'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getVersionAsOf = require('../../src/get-version-as-of');

describe(getVersionAsOf, function() {
  let times = {
    '4.16.3': '2016-10-03T16:43:31.571Z',
    '4.16.4': '2016-10-06T15:13:30.196Z',
    '4.16.5': '2016-10-31T06:49:14.797Z',
  };

  it('works', function() {
    let asof = '2016-10-07T15:13:30.196Z';

    let version = getVersionAsOf(times, asof);

    expect(version).to.equal('4.16.4');
  });

  it('doesn\'t match on exact time', function() {
    let asof = '2016-10-06T15:13:30.196Z';

    let version = getVersionAsOf(times, asof);

    expect(version).to.equal('4.16.3');
  });

  it('allows date object for asof', function() {
    let asof = new Date('2016-10-07T15:13:30.196Z');

    let version = getVersionAsOf(times, asof);

    expect(version).to.equal('4.16.4');
  });
});

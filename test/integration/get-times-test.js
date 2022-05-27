'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const getTimes = require('../../src/get-times');

describe(getTimes, function() {
  it('works', async function() {
    let times = await getTimes('lodash');

    expect(times).to.have.property('0.1.0', '2012-04-23T16:37:12.603Z');
  });
});

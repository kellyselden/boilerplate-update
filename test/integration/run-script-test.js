'use strict';

const { expect } = require('chai');
const co = require('co');
const runScript = require('../../src/run-script');

describe('Integration - runScript', function() {
  it('runs script', co.wrap(function*() {
    let script = '3 + 4';

    let result = yield runScript(script);

    expect(result).to.equal(7);
  }));

  it('spoofs process.argv with tmp cwd', co.wrap(function*() {
    let script = 'process.argv';

    let result = yield runScript(script);

    expect(result).to.have.length(2);
    expect(result[0]).to.equal(process.argv[0]);
    expect(result[1]).to.not.equal(process.cwd());
  }));
});

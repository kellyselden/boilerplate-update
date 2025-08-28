'use strict';

require('mocha-helpers')(module);

const sinon = require('sinon');

const { describe: _describe } = module.exports;

function call(describe, ...args) {
  let callback = args[args.length - 1];

  return describe(...args.slice(0, args.length - 1), function() {
    global.afterEach(function() {
      sinon.restore();
    });

    return callback.call(this, { sinon });
  });
}

function describe() {
  return call(_describe, ...arguments);
}

describe.only = function only() {
  return call(_describe.only, ...arguments);
};

Object.assign(module.exports, {
  describe,
});

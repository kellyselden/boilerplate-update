'use strict';

require('mocha-helpers')(module);

const sinon = require('sinon');

const { describe: _describe } = module.exports;

function describe(...args) {
  let callback = args[args.length - 1];

  return _describe(...args.slice(0, args.length - 1), function() {
    global.afterEach(function() {
      sinon.restore();
    });

    return callback.call(this, { sinon });
  });
}

Object.assign(module.exports, {
  describe
});

'use strict';

const { expect } = require('chai');

module.exports.assertNoUnstaged = function(status) {
  // assert no unstaged changes
  expect(status).to.not.match(/^.\w/m);
};

module.exports.assertNoStaged = function(status) {
  // assert no staged changes
  expect(status).to.not.match(/^\w/m);
};

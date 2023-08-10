'use strict';

const { expect } = require('../helpers/chai');

module.exports.assertNormalUpdate = function(status) {
  expect(status).to.match(/^A {2}.*added-changed\.txt$/m);
  expect(status).to.match(/^A {2}.*added-unchanged\.txt$/m);
  expect(status).to.match(/^M {2}.*present-added-changed\.txt$/m);
  expect(status).to.match(/^M {2}.*present-changed\.txt$/m);
  expect(status).to.match(/^D {2}.*removed-changed\.txt$/m);
  expect(status).to.match(/^D {2}.*removed-unchanged\.txt$/m);
};

module.exports.assertNoUnstaged = function(status) {
  // assert no unstaged changes
  expect(status).to.not.match(/^.\w/m);
};

module.exports.assertNoStaged = function(status) {
  // assert no staged changes
  expect(status).to.not.match(/^\w/m);
};

module.exports.assertCodemodRan = function(status) {
  expect(status).to.match(/^A {2}.*added-changed-copy\.txt$/m);
  expect(status).to.match(/^A {2}.*added-unchanged-copy\.txt$/m);
  expect(status).to.match(/^A {2}.*present-changed-copy\.txt$/m);
};

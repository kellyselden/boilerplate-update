'use strict';

const { expect } = require('../helpers/chai');

module.exports.assertNormalUpdate = function(status) {
  expect(status).to.match(/^A {2}.*added-changed\.txt$/m);
  expect(status).to.match(/^A {2}.*added-unchanged\.txt$/m);
  expect(status).to.match(/^DU .*missing-changed\.txt$/m);
  expect(status).to.match(/^AA .*present-added-changed\.txt$/m);
  expect(status).to.match(/^UU .*present-changed\.txt$/m);
  expect(status).to.match(/^UD .*removed-changed\.txt$/m);
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

module.exports.assertAllStaged = function(status) {
  // assert all changes staged
  expect(status).to.not.match(/^ /m);
};

module.exports.assertCodemodRan = function(status) {
  expect(status).to.match(/^A {2}.*added-changed-copy\.txt$/m);
  expect(status).to.match(/^A {2}.*added-unchanged-copy\.txt$/m);
  if (!process.env.NODE_LTS) {
    expect(status).to.match(/^A {2}.*present-changed-copy\.txt$/m);
  }
};

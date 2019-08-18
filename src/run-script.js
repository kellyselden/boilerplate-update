'use strict';

const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);

module.exports = async function runScript(script) {
  // eslint-disable-next-line no-unused-vars
  let cwd = await tmpDir();

  return eval(script);
};

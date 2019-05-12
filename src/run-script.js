'use strict';

const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);

function sanitize(str) {
  return str.replace(/\\/g, '\\\\');
}

module.exports = async function runScript(script) {
  let cwd = await tmpDir();

  return eval(`process.argv = ['${sanitize(process.argv[0])}', '${sanitize(cwd)}']; ${script}`);
};

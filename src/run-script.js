'use strict';

const { promisify } = require('util');
const createTmpDir = promisify(require('tmp').dir);
const execa = require('execa');

const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;

module.exports = async function runScript(script, cwd) {
  let tmpDir = await createTmpDir();

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#Do_not_ever_use_eval!
  // return eval(script);

  let func = AsyncFunction('require', 'cwd', 'execa', `'use strict';${script}`);

  let _cwd = process.cwd();
  process.chdir(cwd);

  try {
    return await func(require, tmpDir, execa);
  } finally {
    process.chdir(_cwd);
  }
};

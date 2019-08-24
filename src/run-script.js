'use strict';

const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const execa = require('execa');

const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;

module.exports = async function runScript(script) {
  let cwd = await tmpDir();

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#Do_not_ever_use_eval!
  // return eval(script);

  let func = AsyncFunction('require', 'cwd', 'execa', `'use strict';${script}`);

  return await func(require, cwd, execa);
};

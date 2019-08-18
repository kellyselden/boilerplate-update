'use strict';

const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);

module.exports = async function runScript(script) {
  let cwd = await tmpDir();

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#Do_not_ever_use_eval!
  // return eval(script);
  return Function('require', 'cwd', `'use strict';${script}`)(require, cwd);
};

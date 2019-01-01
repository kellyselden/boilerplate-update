'use strict';

const denodeify = require('denodeify');
const tmpDir = denodeify(require('tmp').dir);

function sanitize(str) {
  return str.replace(/\\/g, '\\\\');
}

module.exports = function runScript(script) {
  return tmpDir().then(cwd => {
    return eval(`process.argv = ['${sanitize(process.argv[0])}', '${sanitize(cwd)}']; ${script}`);
  });
};

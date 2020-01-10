'use strict';

const fs = require('fs');
const { promisify } = require('util');

module.exports.run = require('git-diff-apply').run;
module.exports.npx = require('./npx');
module.exports.getCodemods = require('./get-codemods');
module.exports.downloadCodemods = require('./download-codemods');
module.exports.getNodeVersion = require('./get-node-version');
module.exports.open = require('open');
module.exports.runCodemod = require('./run-codemod');
module.exports.require = require;
module.exports.stat = promisify(fs.stat);
module.exports.which = require('which');
module.exports.runScript = require('./run-script');
module.exports.promptCodemods = require('./prompt-codemods');

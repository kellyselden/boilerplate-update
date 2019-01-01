'use strict';

const utils = require('./utils');

module.exports = function runCodemod(codemod) {
  if (codemod.script) {
    return utils.runScript(codemod.script);
  }
  return codemod.commands.reduce((promise, command) => {
    return promise.then(() => {
      return utils.npx(command).catch(() => {});
    });
  }, Promise.resolve());
};

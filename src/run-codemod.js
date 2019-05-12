'use strict';

const utils = require('./utils');

module.exports = async function runCodemod(codemod) {
  if (codemod.script) {
    await utils.runScript(codemod.script);
    return;
  }
  for (let command of codemod.commands) {
    try {
      await utils.npx(command);
    } catch (err) {}
  }
};

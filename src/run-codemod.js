/* eslint-disable no-console */
'use strict';

const utils = require('./utils');

module.exports = async function runCodemod(name, codemod) {
  console.log(`Running codemod ${name}`);
  if (codemod.script) {
    try {
      await utils.runScript(codemod.script);
    } catch (err) {
      console.error(`Error running script ${codemod.script}`);
      return;
    }
  } else {
    for (let i = 0; i < codemod.commands.length; i++) {
      console.log(`Running command ${i + 1} of ${codemod.commands.length}`);
      let command = codemod.commands[i];
      try {
        await utils.npx(command);
      } catch (err) {
        console.error(`Error running command ${command}`);
        return;
      }
      console.log(`Finished running command ${i + 1} of ${codemod.commands.length}`);
    }
  }
  console.log(`Finished running codemod ${name}`);
};

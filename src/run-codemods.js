'use strict';

const utils = require('./utils');

module.exports = async function runCodemods(codemods, cwd) {
  for (let codemod in codemods) {
    await utils.runCodemod(codemods[codemod], cwd);
  }

  await utils.run('git add -A', {
    cwd
  });
};

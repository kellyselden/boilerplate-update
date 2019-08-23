'use strict';

const utils = require('./utils');

module.exports = async function runCodemods(codemods) {
  for (let codemod in codemods) {
    await utils.runCodemod(codemod, codemods[codemod]);
  }
  await utils.run('git add -A');
};

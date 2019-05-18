'use strict';

const utils = require('./utils');

module.exports = async function runCodemods(codemods) {
  for (let codemod of Object.keys(codemods)) {
    await utils.runCodemod(codemods[codemod]);
  }
  await utils.run('git add -A');
};

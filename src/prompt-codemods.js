'use strict';

const utils = require('./utils');

module.exports = async function promptCodemods(codemods) {
  let { default: inquirer } = await import('inquirer');

  let answers = await utils.prompt.call(inquirer.prompt, [{
    type: 'checkbox',
    message: 'These codemods apply to your project. Select which ones to run.',
    name: 'codemods',
    choices: Object.keys(codemods),
  }]);

  return answers.codemods.map(codemod => codemods[codemod]);
};

'use strict';

const inquirer = require('inquirer');

module.exports = async function promptCodemods(codemods) {
  let answers = await inquirer.prompt([{
    type: 'checkbox',
    message: 'These codemods apply to your project. Select which ones to run.',
    name: 'codemods',
    choices: Object.keys(codemods)
  }]);

  return answers.codemods.map(codemod => codemods[codemod]);
};

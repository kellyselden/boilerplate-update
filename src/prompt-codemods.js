'use strict';

const inquirer = require('inquirer');

module.exports = function promptCodemods(codemods) {
  return inquirer.prompt([{
    type: 'checkbox',
    message: 'These codemods apply to your project. Select which ones to run.',
    name: 'codemods',
    choices: Object.keys(codemods)
  }]).then(answers => {
    return answers.codemods.map(codemod => codemods[codemod]);
  });
};

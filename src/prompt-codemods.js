'use strict';

const getApplicableCodemods = require('./get-applicable-codemods');

module.exports = function promptCodemods({
  url,
  projectType,
  startVersion
}) {
  return getApplicableCodemods({
    url,
    projectType,
    startVersion
  }).then(codemods => {
    const inquirer = require('inquirer');

    return inquirer.prompt([{
      type: 'checkbox',
      message: 'These codemods apply to your project. Select which ones to run.',
      name: 'codemods',
      choices: Object.keys(codemods)
    }]).then(answers => {
      return answers.codemods.map(codemod => codemods[codemod]);
    });
  });
};

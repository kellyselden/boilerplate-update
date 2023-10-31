'use strict';

const inquirer = require('inquirer');

module.exports = function inquirerPrompt() {
  return inquirer.prompt(...arguments);
};

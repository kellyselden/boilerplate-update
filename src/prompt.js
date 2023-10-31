'use strict';

const inquirer = require('inquirer');

module.exports = function prompt() {
  return inquirer.prompt(...arguments);
};

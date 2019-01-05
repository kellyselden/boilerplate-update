'use strict';

const run = require('./run');

module.exports = function npm(command) {
  return run(`npm ${command}`);
};

module.exports.json = function npmJson(command) {
  return module.exports(`${command} --json`).then(JSON.parse);
};

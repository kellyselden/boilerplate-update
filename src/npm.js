'use strict';

const { spawn } = require('./run');

module.exports = async function npm() {
  return await spawn('npm', ...arguments);
};

module.exports.json = async function npmJson() {
  return JSON.parse(await module.exports(...arguments, '--json'));
};

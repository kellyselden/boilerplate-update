'use strict';

const run = require('./run');

module.exports = async function npm(command) {
  return await run(`npm ${command}`);
};

module.exports.json = async function npmJson(command) {
  return JSON.parse(await module.exports(`${command} --json`));
};

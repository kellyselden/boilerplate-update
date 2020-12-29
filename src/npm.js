'use strict';

const { exec } = require('./run');

module.exports = async function npm(command) {
  return (await exec(`npm ${command}`)).stdout;
};

module.exports.json = async function npmJson(command) {
  return JSON.parse(await module.exports(`${command} --json`));
};

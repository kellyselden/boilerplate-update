'use strict';

const { exec } = require('./run');

module.exports = async function npm(command) {
  let ps = await exec(`npm ${command}`);

  return ps.stdout;
};

module.exports.json = async function npmJson(command) {
  let text = await module.exports(`${command} --json`);

  return JSON.parse(text);
};

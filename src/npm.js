'use strict';

const { spawn } = require('./run');

module.exports = async function npm() {
  let ps = await spawn('npm', [...arguments]);

  return ps.stdout;
};

module.exports.json = async function npmJson() {
  let text = await module.exports(...arguments, '--json');

  return JSON.parse(text);
};

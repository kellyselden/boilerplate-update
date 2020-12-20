'use strict';

const debug = require('./debug');
const execa = require('execa');

async function exec() {
  debug(...arguments);
  let { stdout } = await execa.command(...arguments);
  debug(stdout);
  return stdout;
}

module.exports = {
  exec
};

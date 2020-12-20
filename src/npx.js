'use strict';

const { exec } = require('./run');
const debug = require('./debug');

function npx(command, options) {
  let npxCommand = `npx ${command}`;

  debug(npxCommand);

  let ps = exec(npxCommand, {
    preferLocal: true,
    stdio: ['pipe', 'pipe', 'inherit'],
    ...options
  });

  ps.stdout.pipe(process.stdout);

  return ps;
}

module.exports = npx;

'use strict';

const { exec } = require('./run');

function npx(command, options) {
  let ps = exec(`npx ${command}`, {
    preferLocal: true,
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options
  });

  ps.stdout.pipe(process.stdout);

  return ps;
}

module.exports = npx;

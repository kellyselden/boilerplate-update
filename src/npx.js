'use strict';

const { exec } = require('./run');

function npx(command, options) {
  let ps = exec(`npx ${command}`, {
    preferLocal: true,
    stdio: ['pipe', 'pipe', 'inherit'],
    ...options
  });

  ps.stdout.pipe(process.stdout);

  return ps;
}

module.exports = npx;

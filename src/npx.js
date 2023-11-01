'use strict';

const { exec } = require('./run');

function npx(command, options) {
  return exec(`npx ${command}`, {
    preferLocal: true,
    stdio: ['pipe', 'inherit', 'inherit'],
    ...options
  });
}

module.exports = npx;

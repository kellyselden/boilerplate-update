'use strict';

const { command: _command } = require('execa');
const debug = require('debug')('boilerplate-update');

function npx(command, options) {
  let npxCommand = `npx ${command}`;

  debug(npxCommand);

  let ps = _command(npxCommand, {
    preferLocal: true,
    stdio: ['pipe', 'pipe', 'inherit'],
    ...options
  });

  ps.stdout.pipe(process.stdout);

  return ps;
}

module.exports = npx;

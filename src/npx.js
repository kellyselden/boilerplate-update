'use strict';

const path = require('path');
const { command: _command } = require('execa');
const debug = require('debug')('boilerplate-update');

module.exports = async function npx(command, options) {
  let npxCommand = `npx ${command}`;
  debug(npxCommand);
  await _command(npxCommand, {
    localDir: path.join(__dirname, '..'),
    stdio: 'inherit',
    ...options
  });
};

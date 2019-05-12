'use strict';

const path = require('path');
const execa = require('execa');
const debug = require('debug')('boilerplate-update');

module.exports = async function npx(command, options = {}) {
  debug(`npx ${command}`);
  await execa('npx', command.split(' '), Object.assign({}, {
    localDir: path.join(__dirname, '..'),
    stdio: 'inherit'
  }, options));
};

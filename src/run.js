'use strict';

const debug = require('./debug');
const execa = require('execa');

function bind(execa) {
  return function() {
    let ps = execa(...arguments);

    ps.stdout.on('data', data => {
      debug(data.toString());
    });

    return ps;
  };
}

const _spawn = bind(execa);
const _exec = bind(execa.command);

function spawn(bin, args = [], options) {
  debug(bin, ...args.map(arg => `"${arg}"`), options);

  return _spawn(...arguments);
}

function exec() {
  debug(...arguments);

  return _exec(...arguments);
}

module.exports = {
  spawn,
  exec
};

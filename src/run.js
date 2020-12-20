'use strict';

const debug = require('./debug');
const execa = require('execa');

function exec() {
  debug(...arguments);

  let ps = execa.command(...arguments);

  ps.stdout.on('data', data => {
    debug(data.toString());
  });

  return ps;
}

module.exports = {
  exec
};

'use strict';

const debug = require('./debug');

function bind(execa) {
  return function() {
    let ps = execa(...arguments);

    ps.stdout?.on('data', data => {
      debug(data.toString());
    });

    return ps;
  };
}

async function spawn(bin, args = [], options) {
  let { execa } = await import('execa');

  let _spawn = bind(execa);

  debug(bin, ...args.map(arg => `"${arg}"`), options);

  return _spawn(...arguments);
}

async function exec() {
  let { execaCommand } = await import('execa');

  let _exec = bind(execaCommand);

  debug(...arguments);

  return _exec(...arguments);
}

module.exports = {
  spawn,
  exec,
};

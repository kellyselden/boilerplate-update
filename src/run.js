'use strict';

const { exec } = require('child_process');
const debug = require('debug')('boilerplate-update');

module.exports = async function run(command, options) {
  return await new Promise((resolve, reject) => {
    debug(command);
    exec(command, options, (err, stdout) => {
      debug(command);
      if (err) {
        return reject(err);
      }
      debug(stdout);
      resolve(stdout);
    });
  });
};

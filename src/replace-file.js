'use strict';

const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

module.exports = function replaceFile(path, callback) {
  return readFile(path, 'utf8').then(callback).then(contents => {
    return writeFile(path, contents);
  });
};

'use strict';

const fs = require('fs');
const denodeify = require('denodeify');
const readFile = denodeify(fs.readFile);
const writeFile = denodeify(fs.writeFile);

module.exports = function replaceFile(path, callback) {
  return readFile(path, 'utf8').then(callback).then(contents => {
    return writeFile(path, contents);
  });
};

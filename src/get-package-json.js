'use strict';

const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

module.exports = function getProjectType() {
  return readFile('package.json', 'utf8').catch(() => {
    throw 'No package.json was found in this directory';
  }).then(packageJson => {
    try {
      packageJson = JSON.parse(packageJson);
    } catch (err) {
      throw 'The package.json is malformed';
    }

    return packageJson;
  });
};

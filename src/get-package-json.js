'use strict';

const fs = require('fs');
const path = require('path');
const denodeify = require('denodeify');
const readFile = denodeify(fs.readFile);

module.exports = function getProjectType(projectPath) {
  let packagePath = path.join(projectPath, 'package.json');

  return readFile(packagePath, 'utf8').catch(() => {
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

'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

module.exports = async function getProjectType(cwd) {
  let packageJson;

  try {
    packageJson = await readFile(path.join(cwd, 'package.json'), 'utf8');
  } catch (err) {
    throw 'No package.json was found in this directory';
  }

  try {
    packageJson = JSON.parse(packageJson);
  } catch (err) {
    throw 'The package.json is malformed';
  }

  return packageJson;
};

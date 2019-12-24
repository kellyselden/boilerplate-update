'use strict';

const path = require('path');
const replaceFile = require('./replace-file');
const { EOL } = require('os');

async function mutatePackageJson(cwd, callback) {
  return await replaceFile(path.join(cwd, 'package.json'), async file => {
    let pkg = JSON.parse(file);
    await callback(pkg);
    return JSON.stringify(pkg, null, 2).replace(/\n/g, EOL) + EOL;
  });
}

module.exports = mutatePackageJson;

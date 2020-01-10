'use strict';

const pacote = require('pacote');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const path = require('path');

module.exports = async function downloadCodemods(url) {
  let dest = await tmpDir();

  await pacote.extract(url, dest);

  let { main } = require(path.join(dest, 'package'));

  let manifest = require(path.join(dest, main));

  return manifest;
};

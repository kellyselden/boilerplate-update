'use strict';

const pacote = require('pacote');

module.exports = async function getVersions(packageName) {
  let packument = await pacote.packument(packageName);

  return Object.keys(packument.versions);
};

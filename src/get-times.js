'use strict';

const pacote = require('pacote-with-npm-config');

module.exports = async function getTimes(packageName) {
  let { time } = await pacote.packument(packageName, { fullMetadata: true });
  delete time['created'];
  delete time['modified'];
  return time;
};

'use strict';

const utils = require('./utils');

module.exports = async function getCodemods(source, json) {
  if (!json) {
    return await utils.downloadCodemods(source);
  }

  return JSON.parse(json);
};

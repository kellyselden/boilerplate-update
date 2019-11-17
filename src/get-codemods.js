'use strict';

const utils = require('./utils');

module.exports = async function getCodemods(url, json) {
  if (!json) {
    json = await utils.downloadCodemods(url);
  }

  return JSON.parse(json);
};

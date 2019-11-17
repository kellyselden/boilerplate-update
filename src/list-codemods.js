'use strict';

const getCodemods = require('./get-codemods');

module.exports = async function listCodemods(url, json) {
  let codemods = await getCodemods(url, json);

  return JSON.stringify(codemods, null, 2);
};

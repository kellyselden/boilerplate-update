'use strict';

const getCodemods = require('./get-codemods');

module.exports = async function listCodemods(source, json) {
  let codemods = await getCodemods(source, json);

  return JSON.stringify(codemods, null, 2);
};

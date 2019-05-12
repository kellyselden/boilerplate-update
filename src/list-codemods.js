'use strict';

const getCodemods = require('./get-codemods');

module.exports = async function listCodemods(url) {
  let codemods = await getCodemods(url);

  return JSON.stringify(codemods, null, 2);
};

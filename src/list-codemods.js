'use strict';

const downloadCodemods = require('./download-codemods');

module.exports = async function listCodemods(url) {
  let codemods = await downloadCodemods(url);

  return JSON.stringify(codemods, null, 2);
};

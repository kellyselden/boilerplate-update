'use strict';

const getCodemods = require('./get-codemods');

module.exports = function listCodemods(url) {
  return getCodemods(url).then(codemods => {
    return JSON.stringify(codemods, null, 2);
  });
};

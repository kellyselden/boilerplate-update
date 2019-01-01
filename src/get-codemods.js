'use strict';

const https = require('https');

module.exports = function getCodemods(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let manifest = '';
      res.on('data', d => {
        manifest += d;
      }).on('end', () => {
        resolve(JSON.parse(manifest));
      });
    }).on('error', reject);
  });
};

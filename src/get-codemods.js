'use strict';

const https = require('https');

module.exports = async function getCodemods(url) {
  let manifest = '';

  await new Promise((resolve, reject) => {
    https.get(url, res => {
      res.on('data', d => {
        manifest += d;
      }).on('end', resolve);
    }).on('error', reject);
  });

  return JSON.parse(manifest);
};

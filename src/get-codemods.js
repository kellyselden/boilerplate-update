'use strict';

const https = require('https');
const HttpProxyAgent = require('https-proxy-agent');

module.exports = async function getCodemods(url) {
  let manifest = '';

  // support corporate firewalls
  let proxy = process.env.https_proxy
    || process.env.HTTPS_PROXY
    || process.env.http_proxy
    || process.env.HTTP_PROXY;

  let httpOptions = {};
  if (proxy) {
    httpOptions = { agent: new HttpProxyAgent(proxy) };
  }

  await new Promise((resolve, reject) => {
    https.get(url, httpOptions, res => {
      res.on('data', d => {
        manifest += d;
      }).on('end', resolve);
    }).on('error', reject);
  });

  return JSON.parse(manifest);
};

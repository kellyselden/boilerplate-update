'use strict';

const pacote = require('pacote');
const { promisify } = require('util');
const createTmpDir = promisify(require('tmp').dir);
const path = require('path');
const npa = require('npm-package-arg');
const https = require('https');
const HttpProxyAgent = require('https-proxy-agent');

async function downloadAndCheckForUpdates(spec) {
  let dest = await createTmpDir();

  let extract = pacote.extract(spec, dest);

  let resolve;

  switch (spec.type) {
    case 'git':
      resolve = pacote.resolve(`${spec.fetchSpec}#semver:*`);
      break;
    case 'version':
      resolve = pacote.resolve(`${spec.name}`);
      break;
    default:
      resolve = (async() => (await extract).resolved)();
      break;
  }

  let [manifest, resolved] = await Promise.all([extract, resolve]);

  if (resolved !== manifest.resolved) {
    // eslint-disable-next-line no-console
    console.warn('There is a new version of the codemods manifest.');
  }

  return dest;
}

async function requireManifest(cwd) {
  let { main } = require(path.join(cwd, 'package'));

  return require(path.join(cwd, main));
}

async function downloadCodemods(source) {
  let spec = npa(source);

  let manifest;

  if (spec.type === 'remote') {
    manifest = '';

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
      https.get(source, httpOptions, res => {
        res.on('data', d => {
          manifest += d;
        }).on('end', resolve);
      }).on('error', reject);
    });
  } else {
    let dest = await module.exports.downloadAndCheckForUpdates(spec);

    manifest = module.exports.requireManifest(dest);
  }

  return manifest;
}

module.exports = downloadCodemods;
module.exports.downloadAndCheckForUpdates = downloadAndCheckForUpdates;
module.exports.requireManifest = requireManifest;

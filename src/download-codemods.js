'use strict';

const pacote = require('pacote');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const path = require('path');
const npa = require('npm-package-arg');

async function downloadAndCheckForUpdates(source) {
  let dest = await tmpDir();

  let spec = npa(source);

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

async function downloadCodemods(url) {
  let dest = await module.exports.downloadAndCheckForUpdates(url);

  let manifest = module.exports.requireManifest(dest);

  return manifest;
}

module.exports = downloadCodemods;
module.exports.downloadAndCheckForUpdates = downloadAndCheckForUpdates;
module.exports.requireManifest = requireManifest;

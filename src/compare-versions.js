'use strict';

const utils = require('./utils');

module.exports = function compareVersions({
  open,
  remoteUrl,
  startTag,
  endTag
}) {
  let compareUrl = `${remoteUrl}/compare/${startTag}...${endTag}`;

  // even though this returns a promise, we don't want to use
  // it because it blocks the process
  // we want to open the browser and exit
  utils.open.call(open, compareUrl, {
    url: true,

    // this means it no longer returns a promise
    wait: false
  });
};

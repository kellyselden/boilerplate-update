'use strict';

const getApplicableCodemods = require('./get-applicable-codemods');
const formatStats = require('./format-stats');

module.exports = function getStats({
  projectOptions,
  startVersion,
  endVersion,
  remoteUrl,
  codemodsUrl,
  packageJson
}) {
  return getApplicableCodemods({
    url: codemodsUrl,
    projectOptions,
    packageJson
  }).then(codemods => {
    return formatStats({
      projectOptions,
      startVersion,
      endVersion,
      remoteUrl,
      codemods
    });
  });
};

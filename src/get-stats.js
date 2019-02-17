'use strict';

const getApplicableCodemods = require('./get-applicable-codemods');
const formatStats = require('./format-stats');

module.exports = function getStats({
  projectOptions,
  startVersion,
  endVersion,
  remoteUrl,
  codemodsUrl
}) {
  return getApplicableCodemods({
    url: codemodsUrl,
    projectOptions,
    startVersion
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

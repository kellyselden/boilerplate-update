'use strict';

const getApplicableCodemods = require('./get-applicable-codemods');
const formatStats = require('./format-stats');

module.exports = function getStats({
  projectType,
  startVersion,
  endVersion,
  remoteUrl,
  codemodsUrl
}) {
  return getApplicableCodemods({
    url: codemodsUrl,
    projectType,
    startVersion
  }).then(codemods => {
    return formatStats({
      projectType,
      startVersion,
      endVersion,
      remoteUrl,
      codemods
    });
  });
};

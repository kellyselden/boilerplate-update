'use strict';

const getApplicableCodemods = require('./get-applicable-codemods');
const formatStats = require('./format-stats');

module.exports = async function getStats({
  projectOptions,
  startVersion,
  endVersion,
  remoteUrl,
  codemodsUrl,
  codemodsJson,
  packageJson
}) {
  let codemods = await getApplicableCodemods({
    url: codemodsUrl,
    json: codemodsJson,
    projectOptions,
    packageJson
  });

  return formatStats({
    projectOptions,
    startVersion,
    endVersion,
    remoteUrl,
    codemods
  });
};

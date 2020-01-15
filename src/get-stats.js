'use strict';

const getApplicableCodemods = require('./get-applicable-codemods');
const formatStats = require('./format-stats');

module.exports = async function getStats({
  projectOptions,
  startVersion,
  endVersion,
  remoteUrl,
  codemodsSource,
  codemodsJson,
  packageJson
}) {
  let codemods = await getApplicableCodemods({
    source: codemodsSource,
    json: codemodsJson,
    projectOptions,
    packageJson
  });

  return formatStats({
    projectOptions,
    startVersion,
    endVersion,
    remoteUrl,
    codemodsSource,
    codemods
  });
};

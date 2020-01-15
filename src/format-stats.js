'use strict';

module.exports = function formatStats({
  projectOptions,
  startVersion,
  endVersion,
  remoteUrl,
  codemodsSource,
  codemods
}) {
  return [
    `project options: ${projectOptions.join(', ')}`,
    `from version: ${startVersion}`,
    `to version: ${endVersion}`,
    remoteUrl ? `output repo: ${remoteUrl}` : null,
    `codemods source: ${codemodsSource}`,
    `applicable codemods: ${Object.keys(codemods).join(', ')}`
  ].filter(Boolean).join('\n');
};

'use strict';

module.exports = function formatStats({
  projectType,
  startVersion,
  endVersion,
  remoteUrl,
  codemods
}) {
  return [
    `project type: ${projectType}`,
    `from version: ${startVersion}`,
    `to version: ${endVersion}`,
    remoteUrl ? `output repo: ${remoteUrl}` : null,
    `applicable codemods: ${Object.keys(codemods).join(', ')}`
  ].filter(Boolean).join('\n');
};

'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const formatStats = require('../../src/format-stats');

describe(formatStats, function() {
  it('works', function() {
    let stats = formatStats({
      projectOptions: ['option1, option2'],
      startVersion: '1.2.3',
      endVersion: '4.5.6',
      remoteUrl: 'http://foo.bar',
      codemodsSource: 'http://codemods.source',
      codemods: { 'codemod1': null, 'codemod2': null },
    });

    expect(stats).to.equal(`project options: option1, option2
from version: 1.2.3
to version: 4.5.6
output repo: http://foo.bar
codemods source: http://codemods.source
applicable codemods: codemod1, codemod2`);
  });

  it('remoteUrl is optional', function() {
    let stats = formatStats({
      projectOptions: ['option1, option2'],
      startVersion: '1.2.3',
      endVersion: '4.5.6',
      codemodsSource: 'http://codemods.source',
      codemods: { 'codemod1': null, 'codemod2': null },
    });

    expect(stats).to.equal(`project options: option1, option2
from version: 1.2.3
to version: 4.5.6
codemods source: http://codemods.source
applicable codemods: codemod1, codemod2`);
  });
});

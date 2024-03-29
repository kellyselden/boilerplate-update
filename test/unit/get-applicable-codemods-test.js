'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const utils = require('../../src/utils');
const getApplicableCodemods = require('../../src/get-applicable-codemods');

describe(getApplicableCodemods, function({ sinon }) {

  let getCodemods;
  let getNodeVersion;

  beforeEach(function() {
    getCodemods = sinon.stub(utils, 'getCodemods');
    getNodeVersion = sinon.stub(utils, 'getNodeVersion');
  });

  it('works', async function() {
    getCodemods.resolves({
      testCodemod: {
        versionRanges: {
          'test-dependency': '^0.1.0'
        },
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '>4.0.0'
      }
    });

    getNodeVersion.returns('6.0.0');

    let codemods = await getApplicableCodemods({
      source: 'testSource',
      json: 'testJson',
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.1.1'
        }
      }
    });

    expect(codemods).to.deep.equal({
      testCodemod: {
        versionRanges: {
          'test-dependency': '^0.1.0'
        },
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '>4.0.0'
      }
    });

    expect(getCodemods.args).to.deep.equal([['testSource', 'testJson']]);
  });

  it('excludes wrong option', async function() {
    getCodemods.resolves({
      testCodemod: {
        versionRanges: {
          'test-dependency': '0.0.1'
        },
        projectOptions: ['testProjectOption2'],
        nodeVersionRange: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption1'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  });

  it('options are optional', async function() {
    getCodemods.resolves({
      testCodemod: {
        versionRanges: {
          'test-dependency': '0.0.1'
        },
        nodeVersionRange: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({
      testCodemod: {
        versionRanges: {
          'test-dependency': '0.0.1'
        },
        nodeVersionRange: '4.0.0'
      }
    });
  });

  it('excludes wrong version', async function() {
    getCodemods.resolves({
      testCodemod: {
        versionRanges: {
          'test-dependency': '0.0.2'
        },
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  });

  it('versions are optional', async function() {
    getCodemods.resolves({
      testCodemod: {
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
      }
    });

    expect(codemods).to.deep.equal({
      testCodemod: {
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '4.0.0'
      }
    });
  });

  it('excludes wrong node version', async function() {
    getCodemods.resolves({
      testCodemod: {
        versionRanges: {
          'test-dependency': '0.0.1'
        },
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '6.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  });

  it('excludes codemod with unsatisfied dependency', async function() {
    getCodemods.resolves({
      testCodemod: {
        versionRanges: {
          'test-dependency': '0.0.2'
        },
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'just-another-dependency': '^0.0.1'
        }
      }
    });

    expect(codemods).to.deep.equal({});
  });

  it('uses minimal applicable version for empty constraint', async function() {
    getCodemods.resolves({
      testCodemod: {
        versionRanges: {
          'test-dependency': '0.0.0'
        },
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': ''
        }
      }
    });

    expect(codemods).to.deep.equal({
      testCodemod: {
        versionRanges: {
          'test-dependency': '0.0.0'
        },
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '4.0.0'
      }
    });
  });

  it('includes prerelease', async function() {
    getCodemods.resolves({
      testCodemod: {
        versionRanges: {
          'test-dependency': '>=1.0.0-beta.1'
        },
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '4.0.0'
      }
    });

    getNodeVersion.returns('4.0.0');

    let codemods = await getApplicableCodemods({
      projectOptions: ['testProjectOption'],
      packageJson: {
        dependencies: {
          'test-dependency': '2.0.0-beta.1'
        }
      }
    });

    expect(codemods).to.deep.equal({
      testCodemod: {
        versionRanges: {
          'test-dependency': '>=1.0.0-beta.1'
        },
        projectOptions: ['testProjectOption'],
        nodeVersionRange: '4.0.0'
      }
    });
  });
});

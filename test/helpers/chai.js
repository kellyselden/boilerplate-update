'use strict';

const chai = require('chai');

chai.use(require('chai-fs'));
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
chai.use(require('sinon-chai'));
chai.use(require('chai-semver'));

module.exports = chai;

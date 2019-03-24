'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('chai');
const path = require('path');
const co = require('co');
const sinon = require('sinon');
const fs = require('fs-extra');
const Project = require('fixturify-project');
const denodeify = require('denodeify');
const tmpDir = denodeify(require('tmp').dir);
const utils = require('../../src/utils');
const _getStartAndEndCommands = require('../../src/get-start-and-end-commands');

const { prepareCommand } = _getStartAndEndCommands;

const cpr = path.resolve(__dirname, '../../node_modules/cpr/bin/cpr');

describe(_getStartAndEndCommands, function() {
  let cwd;
  let sandbox;
  let tmpPath;
  let cacheStub1;
  let cacheStub2;
  let remoteStub1;
  let remoteStub2;
  let mutateStub1;
  let mutateStub2;
  let startPath;
  let endPath;
  let whichStub;

  before(function() {
    cwd = process.cwd();
  });

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    mutateStub2 = sandbox.stub().resolves();
    mutateStub1 = sandbox.stub().returns(mutateStub2);
  });

  afterEach(function() {
    sandbox.restore();

    process.chdir(cwd);
  });

  let createProject = co.wrap(function*({
    tmpPath,
    projectName = 'test-project',
    addDependency = true
  } = {}) {
    if (!tmpPath) {
      tmpPath = yield tmpDir();
    }

    let project = new Project(projectName, '1.2.3');

    if (addDependency) {
      project.addDependency('test-package', '4.5.6');
    }

    project.writeSync(tmpPath);

    return path.join(tmpPath, projectName);
  });

  let setUpLocalScenario = co.wrap(function*() {
    tmpPath = yield createProject();

    process.chdir(tmpPath);
  });

  let setUpGlobalScenario = co.wrap(function*() {
    tmpPath = yield createProject({
      addDependency: false
    });

    let globalPath = yield createProject({
      projectName: 'lib'
    });

    whichStub = sandbox.stub(utils, 'which').resolves(path.resolve(globalPath, '../fake/fake'));

    return globalPath;
  });

  let setUpRemoteScenario = co.wrap(function*() {
    tmpPath = yield createProject({
      addDependency: false
    });
  });

  function getStartAndEndCommands(options) {
    // ensure order for assertions
    let resolve;
    let promise = new Promise(_resolve => {
      resolve = _resolve;
    });

    let callback2 = co.wrap(function*(cwd) {
      let tmpPath = yield createProject({
        tmpPath: cwd
      });

      resolve();

      return Promise.resolve(tmpPath);
    });

    function callback1(stub2) {
      return function({
        options: {
          key
        }
      }) {
        return co.wrap(function*() {
          let tmpPath = yield stub2(...arguments);

          if (key === 'start') {
            startPath = tmpPath;
          } else {
            endPath = tmpPath;
          }

          return tmpPath;
        });
      };
    }

    cacheStub2 = sandbox.stub().callsFake(callback2);
    cacheStub1 = sandbox.stub().callsFake(callback1(cacheStub2));
    remoteStub2 = sandbox.stub().callsFake(callback2);
    remoteStub1 = sandbox.stub().callsFake(callback1(remoteStub2));

    sandbox.stub(_getStartAndEndCommands, 'prepareCommand').callsFake(co.wrap(function*({
      key
    }) {
      if (key === 'end') {
        yield promise;
      }
      return yield prepareCommand(...arguments);
    }));

    return _getStartAndEndCommands(Object.assign({
      projectName: 'test-project',
      packageName: 'test-package',
      packageVersion: '4.5.6',
      createProjectFromCache: cacheStub1,
      createProjectFromRemote: remoteStub1,
      mutatePackageJson: mutateStub1,
      startOptions: {
        key: 'start'
      },
      endOptions: {
        key: 'end'
      }
    }, options));
  }

  it('finds local package', co.wrap(function*() {
    yield setUpLocalScenario();

    let statSpy = sandbox.spy(utils, 'stat');

    let commands = yield getStartAndEndCommands();

    expect(commands).to.deep.equal({
      startCommand: `node ${cpr} ${startPath} .`,
      endCommand: `node ${cpr} ${endPath} .`
    });

    expect(cacheStub1.callCount).to.equal(2);
    expect(cacheStub2.callCount).to.equal(2);
    expect(remoteStub1.callCount).to.equal(0);
    expect(remoteStub2.callCount).to.equal(0);

    expect(cacheStub1.args[0][0].options.key).to.equal('start');
    expect(cacheStub1.args[0][0].packageRoot).to.equal(path.join(process.cwd(), 'node_modules/test-package'));
    expect(cacheStub1.args[1][0].options.key).to.equal('end');
    expect(cacheStub1.args[1][0].packageRoot).to.equal(path.join(process.cwd(), 'node_modules/test-package'));

    expect(cacheStub2.args[0][0]).to.equal(path.resolve(startPath, '..')).and.to.be.a.directory();
    expect(cacheStub2.args[1][0]).to.equal(path.resolve(endPath, '..')).and.to.be.a.directory();

    expect(statSpy.args).to.deep.equal([
      [path.join(process.cwd(), 'node_modules/test-package')],
      [path.join(process.cwd(), 'node_modules/test-package')]
    ]);
  }));

  it('misses local package if version mismatch', co.wrap(function*() {
    yield setUpLocalScenario();

    yield getStartAndEndCommands({
      packageVersion: '4.5.7'
    });

    expect(cacheStub1.callCount).to.equal(0);
    expect(cacheStub2.callCount).to.equal(0);
    expect(remoteStub1.callCount).to.equal(2);
    expect(remoteStub2.callCount).to.equal(2);
  }));

  it('throws if local `stat` throws unexpectedly', co.wrap(function*() {
    yield setUpLocalScenario();

    sandbox.stub(utils, 'stat')
      .withArgs(path.join(process.cwd(), 'node_modules/test-package'))
      .rejects(new Error('test stat error'));

    yield expect(getStartAndEndCommands()).to.be.rejectedWith('test stat error');
  }));

  it('finds global package', co.wrap(function*() {
    let globalPath = yield setUpGlobalScenario();

    let statSpy = sandbox.spy(utils, 'stat');

    let commands = yield getStartAndEndCommands();

    expect(commands).to.deep.equal({
      startCommand: `node ${cpr} ${startPath} .`,
      endCommand: `node ${cpr} ${endPath} .`
    });

    expect(cacheStub1.callCount).to.equal(2);
    expect(cacheStub2.callCount).to.equal(2);
    expect(remoteStub1.callCount).to.equal(0);
    expect(remoteStub2.callCount).to.equal(0);

    expect(cacheStub1.args[0][0].options.key).to.equal('start');
    expect(cacheStub1.args[0][0].packageRoot).to.equal(path.join(globalPath, 'node_modules/test-package'));
    expect(cacheStub1.args[1][0].options.key).to.equal('end');
    expect(cacheStub1.args[1][0].packageRoot).to.equal(path.join(globalPath, 'node_modules/test-package'));

    expect(cacheStub2.args[0][0]).to.equal(path.resolve(startPath, '..')).and.to.be.a.directory();
    expect(cacheStub2.args[1][0]).to.equal(path.resolve(endPath, '..')).and.to.be.a.directory();

    expect(statSpy.args).to.deep.equal([
      [path.join(process.cwd(), 'node_modules/test-package')],
      [path.join(globalPath, 'node_modules/test-package')],
      [path.join(process.cwd(), 'node_modules/test-package')],
      [path.join(globalPath, 'node_modules/test-package')]
    ]);
    expect(whichStub.args).to.deep.equal([
      ['test-package'],
      ['test-package']
    ]);
  }));

  it('misses global package if version mismatch', co.wrap(function*() {
    yield setUpGlobalScenario();

    yield getStartAndEndCommands({
      packageVersion: '4.5.7'
    });

    expect(cacheStub1.callCount).to.equal(0);
    expect(cacheStub2.callCount).to.equal(0);
    expect(remoteStub1.callCount).to.equal(2);
    expect(remoteStub2.callCount).to.equal(2);
  }));

  it('throws if global `stat` throws unexpectedly', co.wrap(function*() {
    let globalPath = yield setUpGlobalScenario();

    let { stat } = utils;

    sandbox.stub(utils, 'stat')
      .callsFake(stat)
      .withArgs(path.join(globalPath, 'node_modules/test-package'))
      .rejects(new Error('test stat error'));

    yield expect(getStartAndEndCommands()).to.be.rejectedWith('test stat error');
  }));

  it('throws if `which` throws unexpectedly', co.wrap(function*() {
    yield setUpGlobalScenario();

    whichStub.rejects(new Error('test which error'));

    yield expect(getStartAndEndCommands({
      packageVersion: '4.5.7'
    })).to.be.rejectedWith('test which error');
  }));

  it('calls remote package', co.wrap(function*() {
    yield setUpRemoteScenario();

    let commands = yield getStartAndEndCommands();

    expect(commands).to.deep.equal({
      startCommand: `node ${cpr} ${startPath} .`,
      endCommand: `node ${cpr} ${endPath} .`
    });

    expect(cacheStub1.callCount).to.equal(0);
    expect(cacheStub2.callCount).to.equal(0);
    expect(remoteStub1.callCount).to.equal(2);
    expect(remoteStub2.callCount).to.equal(2);

    expect(remoteStub1.args[0][0].options.key).to.equal('start');
    expect(remoteStub1.args[1][0].options.key).to.equal('end');

    expect(remoteStub2.args[0][0]).to.equal(path.resolve(startPath, '..')).and.to.be.a.directory();
    expect(remoteStub2.args[1][0]).to.equal(path.resolve(endPath, '..')).and.to.be.a.directory();
  }));

  it('mutates package.json', co.wrap(function*() {
    tmpPath = yield createProject();

    mutateStub2.callsFake(json => {
      json.fakeProperty = true;
      return Promise.resolve();
    });

    yield getStartAndEndCommands();

    expect(path.join(startPath, 'package.json')).to.be.a.file().with.contents.that.match(/"fakeProperty": true/);
    expect(path.join(endPath, 'package.json')).to.be.a.file().with.contents.that.match(/"fakeProperty": true/);
  }));

  it('removes files before checking in', co.wrap(function*() {
    yield setUpLocalScenario();

    yield Promise.all([
      fs.mkdir(path.join(tmpPath, '.git')),
      fs.ensureFile(path.join(tmpPath, 'package-lock.json')),
      fs.ensureFile(path.join(tmpPath, 'yarn.lock'))
    ]);

    yield getStartAndEndCommands();

    expect(path.join(startPath, '.git')).to.not.be.a.path();
    expect(path.join(startPath, 'node_modules')).to.not.be.a.path();
    expect(path.join(startPath, 'package-lock.json')).to.not.be.a.path();
    expect(path.join(startPath, 'yarn.lock')).to.not.be.a.path();
    expect(path.join(endPath, '.git')).to.not.be.a.path();
    expect(path.join(endPath, 'node_modules')).to.not.be.a.path();
    expect(path.join(endPath, 'package-lock.json')).to.not.be.a.path();
    expect(path.join(endPath, 'yarn.lock')).to.not.be.a.path();
  }));
});

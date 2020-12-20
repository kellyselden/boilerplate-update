'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('chai');
const path = require('path');
const sinon = require('sinon');
const fs = require('fs-extra');
const Project = require('fixturify-project');
const { createTmpDir } = require('../../src/tmp');
const utils = require('../../src/utils');
const _getStartAndEndCommands = require('../../src/get-start-and-end-commands');

const { prepareCommand } = _getStartAndEndCommands;

const cpr = path.resolve(__dirname, '../../node_modules/cpr/bin/cpr');

describe(_getStartAndEndCommands, function() {
  let cwd;
  let cacheStub1;
  let cacheStub2;
  let remoteStub1;
  let remoteStub2;
  let mutateStub1;
  let mutateStub2;
  let startPath;
  let endPath;
  let whichStub;

  beforeEach(function() {
    cwd = process.cwd();

    mutateStub2 = sinon.stub().resolves();
    mutateStub1 = sinon.stub().returns(mutateStub2);
  });

  afterEach(function() {
    sinon.restore();
  });

  async function createProject({
    tmpPath,
    projectName = 'test-project',
    addDependency = true
  } = {}) {
    if (!tmpPath) {
      tmpPath = await createTmpDir();
    }

    let project = new Project(projectName, '1.2.3');

    if (addDependency) {
      project.addDependency('test-package', '4.5.6');
    }

    project.writeSync(tmpPath);

    return path.join(tmpPath, projectName);
  }

  async function setUpLocalScenario({
    addDependency = true
  } = {}) {
    let localPath = await createProject({
      addDependency
    });

    cwd = localPath;

    return localPath;
  }

  async function setUpGlobalScenario({
    projectName,
    whichPath = 'fake/fake/fake'
  } = {}) {
    let globalPath = await createProject({
      projectName
    });

    whichStub = sinon.stub(utils, 'which').resolves([
      path.resolve(globalPath, whichPath)
    ]);

    return globalPath;
  }

  async function setUpRemoteScenario() {
    return await createProject({
      addDependency: false
    });
  }

  function getStartAndEndCommands({
    reset,
    init,
    options
  } = {}) {
    // ensure order for assertions
    let resolve;
    let promise = new Promise(_resolve => {
      resolve = _resolve;
    });

    async function callback2(cwd) {
      let tmpPath = await createProject({
        tmpPath: cwd
      });

      resolve();

      return tmpPath;
    }

    function callback1(stub2) {
      return function({
        options: {
          key
        }
      }) {
        return async function() {
          let tmpPath = await stub2(...arguments);

          if (key === 'start') {
            startPath = tmpPath;
          } else {
            endPath = tmpPath;
          }

          return tmpPath;
        };
      };
    }

    cacheStub2 = sinon.stub().callsFake(callback2);
    cacheStub1 = sinon.stub().callsFake(callback1(cacheStub2));
    remoteStub2 = sinon.stub().callsFake(callback2);
    remoteStub1 = sinon.stub().callsFake(callback1(remoteStub2));

    sinon.stub(_getStartAndEndCommands, 'prepareCommand').callsFake(async function({
      options: {
        key
      }
    }) {
      if (key === 'end' && !(reset || init)) {
        await promise;
      }
      return await prepareCommand(...arguments);
    });

    return _getStartAndEndCommands({
      cwd,
      reset,
      init,
      options: {
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
        },
        ...options
      }
    });
  }

  describe('local', function() {
    it('finds local package in project dir', async function() {
      await setUpLocalScenario();

      let statSpy = sinon.spy(utils, 'stat');

      let commands = await getStartAndEndCommands();

      expect(commands).to.deep.equal({
        startCommand: `node ${cpr} ${startPath} .`,
        endCommand: `node ${cpr} ${endPath} .`
      });

      expect(cacheStub1.callCount).to.equal(2);
      expect(cacheStub2.callCount).to.equal(2);
      expect(remoteStub1.callCount).to.equal(0);
      expect(remoteStub2.callCount).to.equal(0);

      expect(cacheStub1.args[0][0].options.key).to.equal('start');
      expect(cacheStub1.args[0][0].packageRoot).to.equal(path.join(cwd, 'node_modules/test-package'));
      expect(cacheStub1.args[1][0].options.key).to.equal('end');
      expect(cacheStub1.args[1][0].packageRoot).to.equal(path.join(cwd, 'node_modules/test-package'));

      expect(cacheStub2.args[0][0]).to.equal(path.resolve(startPath, '..')).and.to.be.a.directory();
      expect(cacheStub2.args[1][0]).to.equal(path.resolve(endPath, '..')).and.to.be.a.directory();

      expect(statSpy.args).to.deep.equal([
        [path.join(cwd, 'node_modules/test-package')],
        [path.join(cwd, 'node_modules/test-package')]
      ]);
    });

    it('finds local package in package dir', async function() {
      await setUpLocalScenario({
        addDependency: false
      });

      let {
        stat,
        require
      } = utils;

      let statStub = sinon.stub(utils, 'stat')
        .callsFake(stat);

      statStub
        .withArgs(path.resolve(__dirname, '../../../../node_modules/test-package'))
        .resolves();

      sinon.stub(utils, 'require')
        .callsFake(require)
        .withArgs(path.resolve(__dirname, '../../../../node_modules/test-package/package.json'))
        .returns({ version: '4.5.6' });

      let commands = await getStartAndEndCommands();

      expect(commands).to.deep.equal({
        startCommand: `node ${cpr} ${startPath} .`,
        endCommand: `node ${cpr} ${endPath} .`
      });

      expect(cacheStub1.callCount).to.equal(2);
      expect(cacheStub2.callCount).to.equal(2);
      expect(remoteStub1.callCount).to.equal(0);
      expect(remoteStub2.callCount).to.equal(0);

      expect(cacheStub1.args[0][0].options.key).to.equal('start');
      expect(cacheStub1.args[0][0].packageRoot).to.equal(path.resolve(__dirname, '../../../../node_modules/test-package'));
      expect(cacheStub1.args[1][0].options.key).to.equal('end');
      expect(cacheStub1.args[1][0].packageRoot).to.equal(path.resolve(__dirname, '../../../../node_modules/test-package'));

      expect(cacheStub2.args[0][0]).to.equal(path.resolve(startPath, '..')).and.to.be.a.directory();
      expect(cacheStub2.args[1][0]).to.equal(path.resolve(endPath, '..')).and.to.be.a.directory();

      expect(statStub.args).to.deep.equal([
        [path.join(cwd, 'node_modules/test-package')],
        [path.resolve(__dirname, '../../../../node_modules/test-package')],
        [path.join(cwd, 'node_modules/test-package')],
        [path.resolve(__dirname, '../../../../node_modules/test-package')]
      ]);
    });

    it('misses local package if version mismatch', async function() {
      await setUpLocalScenario();

      await getStartAndEndCommands({
        options: {
          packageVersion: '4.5.7'
        }
      });

      expect(cacheStub1.callCount).to.equal(0);
      expect(cacheStub2.callCount).to.equal(0);
      expect(remoteStub1.callCount).to.equal(2);
      expect(remoteStub2.callCount).to.equal(2);
    });

    it('finds local package if version in range', async function() {
      await setUpLocalScenario();

      await getStartAndEndCommands({
        options: {
          packageRange: '^4.0.0'
        }
      });

      expect(cacheStub1.callCount).to.equal(2);
      expect(cacheStub2.callCount).to.equal(2);
      expect(remoteStub1.callCount).to.equal(0);
      expect(remoteStub2.callCount).to.equal(0);
    });

    it('throws if local `stat` throws unexpectedly', async function() {
      sinon.stub(utils, 'stat')
        .withArgs(path.join(cwd, 'node_modules/test-package'))
        .rejects(new Error('test stat error'));

      await expect(getStartAndEndCommands()).to.be.rejectedWith('test stat error');
    });
  });

  describe('global', function() {
    it('finds global package in system global', async function() {
      let globalPath = await setUpGlobalScenario({
        whichPath: 'fake'
      });

      let statSpy = sinon.spy(utils, 'stat');

      let commands = await getStartAndEndCommands();

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
        [path.join(cwd, 'node_modules/test-package')],
        [path.resolve(__dirname, '../../../../node_modules/test-package')],
        [path.join(globalPath, 'node_modules/test-package')],
        [path.join(cwd, 'node_modules/test-package')],
        [path.resolve(__dirname, '../../../../node_modules/test-package')],
        [path.join(globalPath, 'node_modules/test-package')]
      ]);
      expect(whichStub.args).to.deep.equal([
        ['test-package', { all: true }],
        ['test-package', { all: true }]
      ]);
    });

    it('finds global package in project node_modules', async function() {
      let globalPath = await setUpGlobalScenario({
        whichPath: 'fake/fake/fake'
      });

      let statSpy = sinon.spy(utils, 'stat');

      let commands = await getStartAndEndCommands();

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
        [path.join(cwd, 'node_modules/test-package')],
        [path.resolve(__dirname, '../../../../node_modules/test-package')],
        [path.join(globalPath, 'fake/fake/node_modules/test-package')],
        [path.join(globalPath, 'node_modules/test-package')],
        [path.join(cwd, 'node_modules/test-package')],
        [path.resolve(__dirname, '../../../../node_modules/test-package')],
        [path.join(globalPath, 'fake/fake/node_modules/test-package')],
        [path.join(globalPath, 'node_modules/test-package')]
      ]);
      expect(whichStub.args).to.deep.equal([
        ['test-package', { all: true }],
        ['test-package', { all: true }]
      ]);
    });

    it('finds global package in nvm lib', async function() {
      let globalPath = await setUpGlobalScenario({
        projectName: 'lib',
        whichPath: '../fake/fake'
      });

      let statSpy = sinon.spy(utils, 'stat');

      let commands = await getStartAndEndCommands();

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
        [path.join(cwd, 'node_modules/test-package')],
        [path.resolve(__dirname, '../../../../node_modules/test-package')],
        [path.resolve(globalPath, '../fake/node_modules/test-package')],
        [path.resolve(globalPath, '../../node_modules/test-package')],
        [path.join(globalPath, 'node_modules/test-package')],
        [path.join(cwd, 'node_modules/test-package')],
        [path.resolve(__dirname, '../../../../node_modules/test-package')],
        [path.resolve(globalPath, '../fake/node_modules/test-package')],
        [path.resolve(globalPath, '../../node_modules/test-package')],
        [path.join(globalPath, 'node_modules/test-package')]
      ]);
      expect(whichStub.args).to.deep.equal([
        ['test-package', { all: true }],
        ['test-package', { all: true }]
      ]);
    });

    it('misses global package if version mismatch', async function() {
      await setUpGlobalScenario();

      await getStartAndEndCommands({
        options: {
          packageVersion: '4.5.7'
        }
      });

      expect(cacheStub1.callCount).to.equal(0);
      expect(cacheStub2.callCount).to.equal(0);
      expect(remoteStub1.callCount).to.equal(2);
      expect(remoteStub2.callCount).to.equal(2);
    });

    it('finds global package if version in range', async function() {
      await setUpGlobalScenario();

      await getStartAndEndCommands({
        options: {
          packageRange: '^4.0.0'
        }
      });

      expect(cacheStub1.callCount).to.equal(2);
      expect(cacheStub2.callCount).to.equal(2);
      expect(remoteStub1.callCount).to.equal(0);
      expect(remoteStub2.callCount).to.equal(0);
    });

    it('throws if global `stat` throws unexpectedly', async function() {
      let globalPath = await setUpGlobalScenario();

      let { stat } = utils;

      sinon.stub(utils, 'stat')
        .callsFake(stat)
        .withArgs(path.join(globalPath, 'node_modules/test-package'))
        .rejects(new Error('test stat error'));

      await expect(getStartAndEndCommands()).to.be.rejectedWith('test stat error');
    });

    it('throws if `which` throws unexpectedly', async function() {
      whichStub = sinon.stub(utils, 'which').rejects(new Error('test which error'));

      await expect(getStartAndEndCommands({
        packageVersion: '4.5.7'
      })).to.be.rejectedWith('test which error');
    });

    it('uses command name in `which` call', async function() {
      let commandName = 'test-command';
      let whichSpy = sinon.spy(utils, 'which').withArgs(commandName);

      await getStartAndEndCommands({
        options: {
          commandName
        }
      });

      expect(whichSpy.callCount).to.equal(2);
    });
  });

  describe('remote', function() {
    it('calls remote package', async function() {
      await setUpRemoteScenario();

      let commands = await getStartAndEndCommands();

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
    });
  });

  it('skips cache if no package name', async function() {
    let statSpy = sinon.spy(utils, 'stat');
    let whichSpy = sinon.spy(utils, 'which');

    await getStartAndEndCommands({
      options: {
        packageName: null
      }
    });

    expect(statSpy.callCount).to.equal(0);
    expect(whichSpy.callCount).to.equal(0);
  });

  it('mutates package.json', async function() {
    await createProject();

    mutateStub2.callsFake(async json => {
      json.fakeProperty = true;
    });

    await getStartAndEndCommands();

    expect(path.join(startPath, 'package.json')).to.be.a.file().with.contents.that.match(/"fakeProperty": true/);
    expect(path.join(endPath, 'package.json')).to.be.a.file().with.contents.that.match(/"fakeProperty": true/);
  });

  it('removes files before checking in', async function() {
    let localPath = await setUpLocalScenario();

    await Promise.all([
      fs.mkdir(path.join(localPath, '.git')),
      fs.ensureFile(path.join(localPath, 'package-lock.json')),
      fs.ensureFile(path.join(localPath, 'yarn.lock'))
    ]);

    await getStartAndEndCommands();

    expect(path.join(startPath, '.git')).to.not.be.a.path();
    expect(path.join(startPath, 'node_modules')).to.not.be.a.path();
    expect(path.join(startPath, 'package-lock.json')).to.not.be.a.path();
    expect(path.join(startPath, 'yarn.lock')).to.not.be.a.path();
    expect(path.join(endPath, '.git')).to.not.be.a.path();
    expect(path.join(endPath, 'node_modules')).to.not.be.a.path();
    expect(path.join(endPath, 'package-lock.json')).to.not.be.a.path();
    expect(path.join(endPath, 'yarn.lock')).to.not.be.a.path();
  });

  it('skips start if reset', async function() {
    await setUpLocalScenario();

    let commands = await getStartAndEndCommands({
      reset: true
    });

    expect(commands).to.deep.equal({
      startCommand: null,
      endCommand: `node ${cpr} ${endPath} .`
    });

    expect(cacheStub1.callCount).to.equal(1);
    expect(cacheStub2.callCount).to.equal(1);

    expect(cacheStub1.args[0][0].options.key).to.equal('end');

    expect(cacheStub2.args[0][0]).to.equal(path.resolve(endPath, '..')).and.to.be.a.directory();
  });

  it('skips start if init', async function() {
    await setUpLocalScenario();

    let commands = await getStartAndEndCommands({
      init: true
    });

    expect(commands).to.deep.equal({
      startCommand: null,
      endCommand: `node ${cpr} ${endPath} .`
    });

    expect(cacheStub1.callCount).to.equal(1);
    expect(cacheStub2.callCount).to.equal(1);

    expect(cacheStub1.args[0][0].options.key).to.equal('end');

    expect(cacheStub2.args[0][0]).to.equal(path.resolve(endPath, '..')).and.to.be.a.directory();
  });
});

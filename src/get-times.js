'use strict';

const npm = require('./npm');

module.exports = async function getTimes(packageName) {
  let time = await npm.json(`view ${packageName} time`);
  delete time['created'];
  delete time['modified'];
  return time;
};

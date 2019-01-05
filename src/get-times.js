'use strict';

const npm = require('./npm');

module.exports = function getTimes(packageName) {
  return npm.json(`view ${packageName} time`).then(time => {
    delete time['created'];
    delete time['modified'];
    return time;
  });
};

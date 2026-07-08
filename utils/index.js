'use strict';

const { LoggerInterface } = require('./interfaces/logger.interface');
const { createModuleDescriptor } = require('./services/module-descriptor');
const { createPlaceholderResult } = require('./services/placeholder-result');
const { stableSerialize, cloneSerializable } = require('./services/stable-serialize');

module.exports = {
  LoggerInterface,
  createModuleDescriptor,
  createPlaceholderResult,
  stableSerialize,
  cloneSerializable
};

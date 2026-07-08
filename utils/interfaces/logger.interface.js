'use strict';

class LoggerInterface {
  info(_message, _meta) {
    throw new Error('LoggerInterface.info() must be implemented');
  }

  error(_message, _meta) {
    throw new Error('LoggerInterface.error() must be implemented');
  }
}

module.exports = {
  LoggerInterface
};

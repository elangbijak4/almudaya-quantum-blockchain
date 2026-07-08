'use strict';

class RpcTransportInterface {
  start() {
    throw new Error('RpcTransportInterface.start() must be implemented');
  }

  stop() {
    throw new Error('RpcTransportInterface.stop() must be implemented');
  }

  registerMethod(_name, _handler) {
    throw new Error('RpcTransportInterface.registerMethod() must be implemented');
  }
}

module.exports = {
  RpcTransportInterface
};

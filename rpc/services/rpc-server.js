'use strict';

const { createPlaceholderResult } = require('../../utils');

class RpcServer {
  constructor({ transport, rpcService = null } = {}) {
    this.transport = transport;
    this.rpcService = rpcService;
    this.isRegistered = false;
  }

  describe() {
    return createPlaceholderResult('rpc', {
      hasRpcService: Boolean(this.rpcService),
      hasTransport: Boolean(this.transport)
    });
  }

  registerDefaultMethods() {
    if (!this.transport) {
      throw new Error('RpcServer requires a transport');
    }

    if (!this.rpcService) {
      throw new Error('RpcServer requires an rpcService');
    }

    this.rpcService.registerMethods(this.transport);
    this.isRegistered = true;
  }

  start(options = {}) {
    if (!this.isRegistered) {
      this.registerDefaultMethods();
    }

    return this.transport.start(options);
  }

  stop() {
    if (typeof this.transport?.stop !== 'function') {
      return false;
    }

    return this.transport.stop();
  }
}

module.exports = {
  RpcServer
};

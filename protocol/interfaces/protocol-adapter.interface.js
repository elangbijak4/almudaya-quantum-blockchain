'use strict';

class ProtocolAdapterInterface {
  send(_message) {
    throw new Error('ProtocolAdapterInterface.send() must be implemented');
  }

  receive() {
    throw new Error('ProtocolAdapterInterface.receive() must be implemented');
  }
}

module.exports = {
  ProtocolAdapterInterface
};

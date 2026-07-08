'use strict';

const { createPlaceholderResult } = require('../../utils');

class ProtocolService {
  constructor({ adapter, consensus } = {}) {
    this.adapter = adapter;
    this.consensus = consensus;
  }

  handshake(peerId) {
    return createPlaceholderResult('protocol', {
      peerId,
      hasAdapter: Boolean(this.adapter)
    });
  }

  simulateConsensusRound(input) {
    if (!this.consensus) {
      throw new Error('ProtocolService requires a consensus instance');
    }

    return this.consensus.simulateRound(input);
  }
}

module.exports = {
  ProtocolService
};

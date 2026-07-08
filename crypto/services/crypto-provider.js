'use strict';

const crypto = require('crypto');
const { stableSerialize } = require('../../utils');

class CryptoProvider {
  hash(input) {
    return crypto.createHash('sha256').update(stableSerialize(input)).digest('hex');
  }

  sign(payload, privateKey) {
    return {
      payloadHash: this.hash(payload),
      privateKeyHint: privateKey ? 'provided' : 'missing',
      signature: null
    };
  }
}

module.exports = {
  CryptoProvider
};

'use strict';

const { cloneSerializable } = require('../../utils');

class ValidatorVote {
  constructor({
    validatorId,
    blockHash,
    accepted,
    reason = null,
    pqRoot = null
  } = {}) {
    this.validatorId = validatorId;
    this.blockHash = blockHash;
    this.accepted = accepted;
    this.reason = reason;
    this.pqRoot = pqRoot;
  }

  toJSON() {
    return cloneSerializable({
      accepted: this.accepted,
      blockHash: this.blockHash,
      pqRoot: this.pqRoot,
      reason: this.reason,
      validatorId: this.validatorId
    });
  }
}

module.exports = {
  ValidatorVote
};

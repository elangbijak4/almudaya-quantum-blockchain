'use strict';

const { cloneSerializable } = require('../../utils');

class Token {
  constructor({ type, value } = {}) {
    this.type = type;
    this.value = value;
  }

  toJSON() {
    return cloneSerializable({
      type: this.type,
      value: this.value
    });
  }
}

module.exports = {
  Token
};

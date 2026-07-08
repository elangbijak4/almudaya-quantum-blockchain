'use strict';

const { cloneSerializable } = require('../../utils');

class ExecutionContext {
  constructor({
    memory = {},
    stack = [],
    instructionPointer = 0,
    returnValue = null,
    halted = false,
    steps = 0,
    gasLimit = 0,
    gasUsed = 0,
    metadata = {}
  } = {}) {
    this.memory = cloneSerializable(memory);
    this.stack = cloneSerializable(stack);
    this.instructionPointer = instructionPointer;
    this.returnValue = returnValue === null ? null : cloneSerializable(returnValue);
    this.halted = halted;
    this.steps = steps;
    this.gasLimit = gasLimit;
    this.gasUsed = gasUsed;
    this.metadata = cloneSerializable(metadata);
  }

  toJSON() {
    return cloneSerializable({
      gasLimit: this.gasLimit,
      gasUsed: this.gasUsed,
      halted: this.halted,
      instructionPointer: this.instructionPointer,
      memory: this.memory,
      metadata: this.metadata,
      returnValue: this.returnValue,
      stack: this.stack,
      steps: this.steps
    });
  }
}

module.exports = {
  ExecutionContext
};

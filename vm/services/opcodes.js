'use strict';

const OPCODES = Object.freeze({
  ADD: 'ADD',
  DIV: 'DIV',
  JMP: 'JMP',
  LOAD: 'LOAD',
  MUL: 'MUL',
  POP: 'POP',
  PUSH: 'PUSH',
  RETURN: 'RETURN',
  STORE: 'STORE',
  SUB: 'SUB'
});

module.exports = {
  OPCODES
};

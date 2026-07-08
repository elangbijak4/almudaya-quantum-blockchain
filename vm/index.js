'use strict';

const { VirtualMachineInterface } = require('./interfaces/virtual-machine.interface');
const { ExecutionContext } = require('./models/execution-context');
const { OPCODES } = require('./services/opcodes');
const { VirtualMachine } = require('./services/virtual-machine');

module.exports = {
  ExecutionContext,
  OPCODES,
  VirtualMachineInterface,
  VirtualMachine
};

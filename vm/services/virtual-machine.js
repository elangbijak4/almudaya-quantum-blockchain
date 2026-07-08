'use strict';

const { cloneSerializable } = require('../../utils');
const { ExecutionContext } = require('../models/execution-context');
const { OPCODES } = require('./opcodes');

class VirtualMachine {
  constructor({ maxSteps = 10000 } = {}) {
    this.maxSteps = maxSteps;
    this.gasSchedule = Object.freeze({
      [OPCODES.PUSH]: 1,
      [OPCODES.POP]: 1,
      [OPCODES.ADD]: 2,
      [OPCODES.SUB]: 2,
      [OPCODES.MUL]: 3,
      [OPCODES.DIV]: 3,
      [OPCODES.STORE]: 5,
      [OPCODES.LOAD]: 5,
      [OPCODES.JMP]: 2,
      [OPCODES.RETURN]: 1
    });
  }

  execute(programInput, contextInput = {}) {
    const program = this.normalizeProgram(programInput);
    const context = this.createExecutionContext(contextInput);
    const effectiveGasLimit = contextInput.gasLimit ?? this.estimateExecutionGasBudget(program);

    context.gasLimit = effectiveGasLimit;

    while (!context.halted) {
      try {
        if (context.steps >= this.maxSteps) {
          throw new Error(`VM exceeded deterministic step limit of ${this.maxSteps}`);
        }

        if (context.instructionPointer < 0 || context.instructionPointer >= program.length) {
          throw new Error('Instruction pointer out of bounds');
        }

        const instruction = program[context.instructionPointer];
        this.consumeGas(instruction, context);
        this.executeInstruction(instruction, context);
        context.steps += 1;
      } catch (error) {
        context.error = error.message;
        context.halted = true;
      }
    }

    return context.toJSON();
  }

  executeContractFunction({
    artifact,
    functionName,
    args = {},
    contractAddress,
    callerAddress = null,
    worldStateManager,
    gasLimit = 1000
  } = {}) {
    if (!artifact?.bytecode?.functions?.[functionName]) {
      throw new Error(`Unknown contract function: ${functionName}`);
    }

    if (typeof contractAddress !== 'string' || contractAddress.length === 0) {
      throw new Error('Contract address is required');
    }

    if (!worldStateManager) {
      throw new Error('WorldStateManager is required for contract execution');
    }

    const functionArtifact = artifact.bytecode.functions[functionName];
    const initialMemory = this.buildContractMemory({
      args,
      contractAddress,
      functionArtifact,
      initialState: artifact.bytecode.initialState,
      worldStateManager
    });
    const result = this.execute(functionArtifact.instructions, {
      gasLimit,
      memory: initialMemory,
      metadata: {
        callerAddress,
        contractAddress,
        functionName
      },
      stack: []
    });
    const nextStorage = this.extractContractStorage(result.memory);

    worldStateManager.replaceContractStorageSnapshot(contractAddress, nextStorage);

    return cloneSerializable({
      contractAddress,
      gasLimit,
      gasUsed: result.gasUsed,
      memory: result.memory,
      returnValue: result.returnValue,
      stateRoot: worldStateManager.getStateRoot(),
      storage: nextStorage
    });
  }

  createExecutionContext(contextInput) {
    const context = new ExecutionContext({
      gasLimit: contextInput.gasLimit ?? 0,
      gasUsed: 0,
      instructionPointer: contextInput.instructionPointer ?? 0,
      memory: contextInput.memory ?? {},
      metadata: contextInput.metadata ?? {},
      stack: contextInput.stack ?? []
    });

    if (!Number.isInteger(context.instructionPointer) || context.instructionPointer < 0) {
      throw new Error('Execution context instructionPointer must be a non-negative integer');
    }

    if (!Array.isArray(context.stack)) {
      throw new Error('Execution context stack must be an array');
    }

    if (!context.memory || typeof context.memory !== 'object' || Array.isArray(context.memory)) {
      throw new Error('Execution context memory must be an object');
    }

    if (!Number.isInteger(context.gasLimit) || context.gasLimit < 0) {
      throw new Error('Execution context gasLimit must be a non-negative integer');
    }

    this.assertDeterministicValues(context.stack);
    this.assertDeterministicValues(context.memory);
    this.assertDeterministicValue(context.metadata);

    return context;
  }

  estimateExecutionGasBudget(program) {
    const highestOpcodeCost = Math.max(...Object.values(this.gasSchedule));
    return program.length * highestOpcodeCost * this.maxSteps;
  }

  buildContractMemory({
    args,
    contractAddress,
    functionArtifact,
    initialState = {},
    worldStateManager
  }) {
    const persistedStorage = worldStateManager.getContractStorageSnapshot(contractAddress);
    const memory = cloneSerializable(initialState);

    for (const [key, value] of Object.entries(persistedStorage)) {
      memory[`state.${key}`] = cloneSerializable(value);
    }

    for (const paramName of functionArtifact.params || []) {
      memory[`arg.${paramName}`] = Object.prototype.hasOwnProperty.call(args, paramName)
        ? cloneSerializable(args[paramName])
        : null;
    }

    return memory;
  }

  extractContractStorage(memory) {
    const storage = {};

    for (const [key, value] of Object.entries(memory)) {
      if (key.startsWith('state.')) {
        storage[key.slice('state.'.length)] = cloneSerializable(value);
      }
    }

    return storage;
  }

  normalizeProgram(programInput) {
    if (!Array.isArray(programInput) || programInput.length === 0) {
      throw new Error('VM program must be a non-empty instruction array');
    }

    return programInput.map((instruction, index) => this.normalizeInstruction(instruction, index));
  }

  normalizeInstruction(instruction, index) {
    if (!instruction || typeof instruction !== 'object' || Array.isArray(instruction)) {
      throw new Error(`Instruction at index ${index} must be an object`);
    }

    if (typeof instruction.opcode !== 'string' || !OPCODES[instruction.opcode]) {
      throw new Error(`Instruction at index ${index} has unsupported opcode`);
    }

    const normalizedInstruction = cloneSerializable(instruction);

    switch (normalizedInstruction.opcode) {
      case OPCODES.PUSH:
        if (!Object.prototype.hasOwnProperty.call(normalizedInstruction, 'value')) {
          throw new Error(`PUSH at index ${index} requires a value`);
        }

        this.assertDeterministicValue(normalizedInstruction.value);
        break;
      case OPCODES.STORE:
      case OPCODES.LOAD:
        if (typeof normalizedInstruction.key !== 'string' || normalizedInstruction.key.length === 0) {
          throw new Error(`${normalizedInstruction.opcode} at index ${index} requires a string key`);
        }
        break;
      case OPCODES.JMP:
        if (!Number.isInteger(normalizedInstruction.target) || normalizedInstruction.target < 0) {
          throw new Error(`JMP at index ${index} requires a non-negative integer target`);
        }
        break;
      default:
        break;
    }

    return normalizedInstruction;
  }

  executeInstruction(instruction, context) {
    switch (instruction.opcode) {
      case OPCODES.PUSH:
        context.stack.push(cloneSerializable(instruction.value));
        context.instructionPointer += 1;
        return;
      case OPCODES.POP:
        this.popStackValue(context);
        context.instructionPointer += 1;
        return;
      case OPCODES.ADD:
        this.executeBinaryMath(context, (left, right) => left + right);
        return;
      case OPCODES.SUB:
        this.executeBinaryMath(context, (left, right) => left - right);
        return;
      case OPCODES.MUL:
        this.executeBinaryMath(context, (left, right) => left * right);
        return;
      case OPCODES.DIV:
        this.executeBinaryMath(context, (left, right) => {
          if (right === 0) {
            throw new Error('DIV cannot divide by zero');
          }

          return Math.trunc(left / right);
        });
        return;
      case OPCODES.STORE: {
        const value = this.popStackValue(context);
        context.memory[instruction.key] = cloneSerializable(value);
        context.instructionPointer += 1;
        return;
      }
      case OPCODES.LOAD: {
        const value = Object.prototype.hasOwnProperty.call(context.memory, instruction.key)
          ? context.memory[instruction.key]
          : null;
        context.stack.push(cloneSerializable(value));
        context.instructionPointer += 1;
        return;
      }
      case OPCODES.JMP:
        context.instructionPointer = instruction.target;
        return;
      case OPCODES.RETURN:
        context.returnValue = cloneSerializable(this.popStackValue(context));
        context.halted = true;
        return;
      default:
        throw new Error(`Unsupported opcode: ${instruction.opcode}`);
    }
  }

  consumeGas(instruction, context) {
    const gasCost = this.gasSchedule[instruction.opcode] ?? 1;

    if (context.gasUsed + gasCost > context.gasLimit) {
      throw new Error(`Out of gas at opcode ${instruction.opcode}`);
    }

    context.gasUsed += gasCost;
  }

  executeBinaryMath(context, operation) {
    const right = this.popNumericStackValue(context);
    const left = this.popNumericStackValue(context);
    const result = operation(left, right);

    if (!Number.isFinite(result)) {
      throw new Error('Arithmetic result must be a finite number');
    }

    context.stack.push(result);
    context.instructionPointer += 1;
  }

  popStackValue(context) {
    if (context.stack.length === 0) {
      throw new Error('VM stack underflow');
    }

    return context.stack.pop();
  }

  popNumericStackValue(context) {
    const value = this.popStackValue(context);

    if (!Number.isFinite(value)) {
      throw new Error('Arithmetic opcodes require finite numeric operands');
    }

    return value;
  }

  assertDeterministicValues(value) {
    if (Array.isArray(value)) {
      for (const item of value) {
        this.assertDeterministicValue(item);
      }

      return;
    }

    if (value && typeof value === 'object') {
      for (const nestedValue of Object.values(value)) {
        this.assertDeterministicValue(nestedValue);
      }
    }
  }

  assertDeterministicValue(value) {
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'undefined') {
      throw new Error('VM values must be deterministic and serializable');
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        this.assertDeterministicValue(item);
      }

      return;
    }

    if (value && typeof value === 'object') {
      for (const nestedValue of Object.values(value)) {
        this.assertDeterministicValue(nestedValue);
      }

      return;
    }

    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error('VM numeric values must be finite');
    }
  }
}

module.exports = {
  VirtualMachine
};

'use strict';

const { cloneSerializable } = require('../../utils');
const { OPCODES } = require('../../vm/services/opcodes');

class BytecodeGenerator {
  generate(ast) {
    this.validateContractAst(ast);

    const stateVariables = new Set(ast.body.state.map((entry) => entry.name));
    const initialState = {};

    for (const stateDeclaration of ast.body.state) {
      initialState[this.toStateKey(stateDeclaration.name)] = this.evaluateConstantExpression(stateDeclaration.value);
    }

    const functions = {};

    for (const fn of ast.body.functions) {
      functions[fn.name] = this.generateFunctionBytecode(fn, stateVariables);
    }

    return cloneSerializable({
      ast,
      bytecode: {
        functions,
        initialState
      },
      contractName: ast.name
    });
  }

  validateContractAst(ast) {
    if (!ast || ast.type !== 'Contract') {
      throw new Error('Bytecode generator requires a contract AST');
    }

    this.assertUniqueNames(ast.body.state.map((entry) => entry.name), 'state variable');
    this.assertUniqueNames(ast.body.functions.map((entry) => entry.name), 'function');

    for (const fn of ast.body.functions) {
      this.assertUniqueNames(fn.params, `parameter in function ${fn.name}`);
    }
  }

  assertUniqueNames(names, label) {
    const seen = new Set();

    for (const name of names) {
      if (seen.has(name)) {
        throw new Error(`Duplicate ${label} name: ${name}`);
      }

      seen.add(name);
    }
  }

  generateFunctionBytecode(fn, stateVariables) {
    const localVariables = new Set(fn.params.map((param) => param));
    const instructions = [];

    for (const statement of fn.body) {
      this.emitExpression(statement.expression, instructions, stateVariables, localVariables);
      instructions.push({
        key: this.resolveStorageKey(statement.target, stateVariables, localVariables),
        opcode: OPCODES.STORE
      });
    }

    const returnVariable = fn.body.length > 0 ? fn.body[fn.body.length - 1].target : null;

    if (returnVariable) {
      instructions.push({
        key: this.resolveStorageKey(returnVariable, stateVariables, localVariables),
        opcode: OPCODES.LOAD
      });
    } else {
      instructions.push({
        opcode: OPCODES.PUSH,
        value: null
      });
    }

    instructions.push({
      opcode: OPCODES.RETURN
    });

    return {
      instructions,
      params: cloneSerializable(fn.params)
    };
  }

  emitExpression(expression, instructions, stateVariables, localVariables) {
    switch (expression.type) {
      case 'NumberLiteral':
        instructions.push({
          opcode: OPCODES.PUSH,
          value: expression.value
        });
        return;
      case 'Identifier':
        instructions.push({
          key: this.resolveStorageKey(expression.name, stateVariables, localVariables),
          opcode: OPCODES.LOAD
        });
        return;
      case 'BinaryExpression':
        this.emitExpression(expression.left, instructions, stateVariables, localVariables);
        this.emitExpression(expression.right, instructions, stateVariables, localVariables);
        instructions.push({
          opcode: this.resolveOpcode(expression.operator)
        });
        return;
      default:
        throw new Error(`Unsupported expression type: ${expression.type}`);
    }
  }

  evaluateConstantExpression(expression) {
    switch (expression.type) {
      case 'NumberLiteral':
        return expression.value;
      case 'BinaryExpression': {
        const left = this.evaluateConstantExpression(expression.left);
        const right = this.evaluateConstantExpression(expression.right);

        switch (expression.operator) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            if (right === 0) {
              throw new Error('Constant expression cannot divide by zero');
            }

            return Math.trunc(left / right);
          default:
            throw new Error(`Unsupported constant operator: ${expression.operator}`);
        }
      }
      default:
        throw new Error('State declarations only support constant arithmetic expressions');
    }
  }

  resolveStorageKey(name, stateVariables, localVariables) {
    if (stateVariables.has(name)) {
      return this.toStateKey(name);
    }

    if (localVariables.has(name)) {
      return this.toArgumentKey(name);
    }

    throw new Error(`Unknown identifier in function body: ${name}`);
  }

  resolveOpcode(operator) {
    switch (operator) {
      case '+':
        return OPCODES.ADD;
      case '-':
        return OPCODES.SUB;
      case '*':
        return OPCODES.MUL;
      case '/':
        return OPCODES.DIV;
      default:
        throw new Error(`Unsupported arithmetic operator: ${operator}`);
    }
  }

  toStateKey(name) {
    return `state.${name}`;
  }

  toArgumentKey(name) {
    return `arg.${name}`;
  }
}

module.exports = {
  BytecodeGenerator
};

'use strict';

const { cloneSerializable } = require('../../utils');

class Parser {
  parse(tokensInput) {
    if (!Array.isArray(tokensInput) || tokensInput.length === 0) {
      throw new Error('Parser requires a non-empty token array');
    }

    this.tokens = cloneSerializable(tokensInput);
    this.current = 0;

    const ast = this.parseContract();

    if (!this.isAtEnd()) {
      throw new Error('Unexpected trailing tokens after contract declaration');
    }

    return ast;
  }

  parseContract() {
    this.consumeKeyword('contract');
    const name = this.consumeIdentifier();
    this.consumeSymbol('{');

    const state = [];
    const functions = [];

    while (!this.checkSymbol('}')) {
      if (this.checkKeyword('state')) {
        state.push(this.parseStateDeclaration());
        continue;
      }

      if (this.checkKeyword('function')) {
        functions.push(this.parseFunctionDeclaration());
        continue;
      }

      throw new Error(`Unexpected token inside contract body: ${this.peek()?.value}`);
    }

    this.consumeSymbol('}');

    return {
      body: {
        functions,
        state
      },
      name,
      type: 'Contract'
    };
  }

  parseStateDeclaration() {
    this.consumeKeyword('state');
    const name = this.consumeIdentifier();
    this.consumeSymbol('=');
    const value = this.parseExpression();
    this.consumeSymbol(';');

    return {
      name,
      type: 'StateDeclaration',
      value
    };
  }

  parseFunctionDeclaration() {
    this.consumeKeyword('function');
    const name = this.consumeIdentifier();
    this.consumeSymbol('(');

    const params = [];

    if (!this.checkSymbol(')')) {
      do {
        params.push(this.consumeIdentifier());
      } while (this.matchSymbol(','));
    }

    this.consumeSymbol(')');
    this.consumeSymbol('{');

    const body = [];

    while (!this.checkSymbol('}')) {
      body.push(this.parseAssignmentStatement());
    }

    this.consumeSymbol('}');

    return {
      body,
      name,
      params,
      type: 'FunctionDeclaration'
    };
  }

  parseAssignmentStatement() {
    const target = this.consumeIdentifier();
    this.consumeSymbol('=');
    const expression = this.parseExpression();
    this.consumeSymbol(';');

    return {
      expression,
      target,
      type: 'AssignmentStatement'
    };
  }

  parseExpression() {
    return this.parseAddition();
  }

  parseAddition() {
    let expression = this.parseMultiplication();

    while (this.matchSymbol('+') || this.matchSymbol('-')) {
      const operator = this.previous().value;
      const right = this.parseMultiplication();

      expression = {
        left: expression,
        operator,
        right,
        type: 'BinaryExpression'
      };
    }

    return expression;
  }

  parseMultiplication() {
    let expression = this.parsePrimary();

    while (this.matchSymbol('*') || this.matchSymbol('/')) {
      const operator = this.previous().value;
      const right = this.parsePrimary();

      expression = {
        left: expression,
        operator,
        right,
        type: 'BinaryExpression'
      };
    }

    return expression;
  }

  parsePrimary() {
    if (this.matchType('NUMBER')) {
      return {
        type: 'NumberLiteral',
        value: this.previous().value
      };
    }

    if (this.matchType('IDENTIFIER')) {
      return {
        name: this.previous().value,
        type: 'Identifier'
      };
    }

    if (this.matchSymbol('(')) {
      const expression = this.parseExpression();
      this.consumeSymbol(')');
      return expression;
    }

    throw new Error(`Unexpected token in expression: ${this.peek()?.value}`);
  }

  consumeKeyword(value) {
    if (this.checkKeyword(value)) {
      return this.advance();
    }

    throw new Error(`Expected keyword: ${value}`);
  }

  consumeIdentifier() {
    if (this.checkType('IDENTIFIER')) {
      return this.advance().value;
    }

    throw new Error('Expected identifier');
  }

  consumeSymbol(value) {
    if (this.checkSymbol(value)) {
      return this.advance();
    }

    throw new Error(`Expected symbol: ${value}`);
  }

  matchType(type) {
    if (this.checkType(type)) {
      this.advance();
      return true;
    }

    return false;
  }

  matchSymbol(value) {
    if (this.checkSymbol(value)) {
      this.advance();
      return true;
    }

    return false;
  }

  checkKeyword(value) {
    return this.checkToken('KEYWORD', value);
  }

  checkSymbol(value) {
    return this.checkToken('SYMBOL', value);
  }

  checkType(type) {
    if (this.isAtEnd()) {
      return false;
    }

    return this.peek().type === type;
  }

  checkToken(type, value) {
    if (this.isAtEnd()) {
      return false;
    }

    const token = this.peek();
    return token.type === type && token.value === value;
  }

  advance() {
    if (!this.isAtEnd()) {
      this.current += 1;
    }

    return this.previous();
  }

  isAtEnd() {
    return this.current >= this.tokens.length;
  }

  peek() {
    return this.tokens[this.current] ?? null;
  }

  previous() {
    return this.tokens[this.current - 1] ?? null;
  }
}

module.exports = {
  Parser
};

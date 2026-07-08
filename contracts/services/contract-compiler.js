'use strict';

const { cloneSerializable } = require('../../utils');
const { BytecodeGenerator } = require('./bytecode-generator');
const { Parser } = require('./parser');
const { Tokenizer } = require('./tokenizer');

class ContractCompiler {
  constructor({
    tokenizer = new Tokenizer(),
    parser = new Parser(),
    bytecodeGenerator = new BytecodeGenerator()
  } = {}) {
    this.tokenizer = tokenizer;
    this.parser = parser;
    this.bytecodeGenerator = bytecodeGenerator;
  }

  compile(source) {
    const tokens = this.tokenizer.tokenize(source);
    const ast = this.parser.parse(tokens);
    const artifact = this.bytecodeGenerator.generate(ast);

    return cloneSerializable({
      ast,
      bytecode: artifact.bytecode,
      contractName: artifact.contractName,
      source,
      tokens
    });
  }
}

module.exports = {
  ContractCompiler
};

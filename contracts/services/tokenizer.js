'use strict';

const { Token } = require('../models/token');

class Tokenizer {
  tokenize(source) {
    if (typeof source !== 'string' || source.trim().length === 0) {
      throw new Error('Contract source must be a non-empty string');
    }

    const tokens = [];
    let cursor = 0;

    while (cursor < source.length) {
      const char = source[cursor];

      if (/\s/.test(char)) {
        cursor += 1;
        continue;
      }

      if (/[A-Za-z_]/.test(char)) {
        let value = char;
        cursor += 1;

        while (cursor < source.length && /[A-Za-z0-9_]/.test(source[cursor])) {
          value += source[cursor];
          cursor += 1;
        }

        tokens.push(new Token({
          type: this.isKeyword(value) ? 'KEYWORD' : 'IDENTIFIER',
          value
        }));
        continue;
      }

      if (/[0-9]/.test(char)) {
        let value = char;
        cursor += 1;

        while (cursor < source.length && /[0-9]/.test(source[cursor])) {
          value += source[cursor];
          cursor += 1;
        }

        tokens.push(new Token({
          type: 'NUMBER',
          value: Number(value)
        }));
        continue;
      }

      if ('{}(),;=+-*/'.includes(char)) {
        tokens.push(new Token({
          type: 'SYMBOL',
          value: char
        }));
        cursor += 1;
        continue;
      }

      throw new Error(`Unexpected character in source: ${char}`);
    }

    return tokens.map((token) => token.toJSON());
  }

  isKeyword(value) {
    return ['contract', 'function', 'state'].includes(value);
  }
}

module.exports = {
  Tokenizer
};

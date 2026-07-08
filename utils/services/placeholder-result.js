'use strict';

function createPlaceholderResult(moduleName, details = {}) {
  return Object.freeze({
    module: moduleName,
    status: 'placeholder',
    ...details
  });
}

module.exports = {
  createPlaceholderResult
};

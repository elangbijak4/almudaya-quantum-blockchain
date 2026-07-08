'use strict';

function createModuleDescriptor(name, description) {
  return Object.freeze({
    name,
    description,
    experimental: true
  });
}

module.exports = {
  createModuleDescriptor
};

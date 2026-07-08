'use strict';

class CoreModuleInterface {
  initialize() {
    throw new Error('CoreModuleInterface.initialize() must be implemented');
  }

  getStatus() {
    throw new Error('CoreModuleInterface.getStatus() must be implemented');
  }
}

module.exports = {
  CoreModuleInterface
};

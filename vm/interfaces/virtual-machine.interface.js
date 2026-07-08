'use strict';

class VirtualMachineInterface {
  execute(_message, _context) {
    throw new Error('VirtualMachineInterface.execute() must be implemented');
  }
}

module.exports = {
  VirtualMachineInterface
};

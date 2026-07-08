'use strict';

class AddressDeriverInterface {
  deriveAddress(_publicKey, _metadata) {
    throw new Error('AddressDeriverInterface.deriveAddress() must be implemented');
  }
}

module.exports = {
  AddressDeriverInterface
};

'use strict';

const { createPlaceholderResult } = require('../../utils');

class CoreCoordinator {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.status = 'idle';
  }

  initialize() {
    this.status = 'initialized';

    return createPlaceholderResult('core', {
      status: this.status,
      initializedAt: 'static-bootstrap',
      module: 'core',
      dependencies: Object.keys(this.dependencies).sort()
    });
  }

  getStatus() {
    return this.status;
  }
}

module.exports = {
  CoreCoordinator
};

'use strict';

const path = require('path');

class ExpressJsonRpcTransport {
  constructor({
    port = 8545,
    host = '127.0.0.1',
    route = '/rpc',
    bodyLimit = '1mb',
    staticDirectory = null,
    healthRoute = '/health'
  } = {}) {
    this.port = port;
    this.host = host;
    this.route = route;
    this.bodyLimit = bodyLimit;
    this.staticDirectory = staticDirectory;
    this.healthRoute = healthRoute;
    this.methods = new Map();
    this.app = null;
    this.server = null;
  }

  registerMethod(name, handler) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('RPC method name is required');
    }

    if (typeof handler !== 'function') {
      throw new Error(`RPC handler for method ${name} must be a function`);
    }

    this.methods.set(name, handler);
  }

  createApp() {
    const express = require('express');
    const app = express();

    app.use(express.json({ limit: this.bodyLimit }));
    app.get(this.healthRoute, (_request, response) => {
      response.json({
        ok: true,
        route: this.route
      });
    });

    app.get('/dashboard-info', (_request, response) => {
      response.json(this.dashboardInfo || { mnemonic: '', accounts: [] });
    });
    app.post(this.route, async (request, response) => {
      const payload = request.body;

      try {
        const { body, httpStatus } = await this.dispatch(payload);
        response.status(httpStatus).json(body);
      } catch (error) {
        const reply = this.createErrorResponse(payload?.id ?? null, -32603, error.message, 500);
        response.status(reply.httpStatus).json(reply.body);
      }
    });

    if (typeof this.staticDirectory === 'string' && this.staticDirectory.length > 0) {
      app.use(express.static(path.resolve(this.staticDirectory)));
    }

    return app;
  }

  async dispatch(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return this.createErrorResponse(null, -32600, 'Invalid JSON-RPC payload', 400);
    }

    if (payload.jsonrpc !== '2.0') {
      return this.createErrorResponse(payload.id ?? null, -32600, 'Unsupported JSON-RPC version', 400);
    }

    if (typeof payload.method !== 'string' || payload.method.length === 0) {
      return this.createErrorResponse(payload.id ?? null, -32600, 'JSON-RPC method is required', 400);
    }

    const handler = this.methods.get(payload.method);

    if (!handler) {
      return this.createErrorResponse(payload.id ?? null, -32601, `Unknown method: ${payload.method}`, 404);
    }

    try {
      const result = await handler(payload.params ?? {});
      return {
        body: {
          id: payload.id ?? null,
          jsonrpc: '2.0',
          result
        },
        httpStatus: 200
      };
    } catch (error) {
      return this.createErrorResponse(payload.id ?? null, error.code ?? -32000, error.message, error.httpStatus ?? 400);
    }
  }

  createErrorResponse(id, code, message, httpStatus = 400) {
    return {
      body: {
        error: {
          code,
          message
        },
        id,
        jsonrpc: '2.0'
      },
      httpStatus
    };
  }

  start(options = {}) {
    if (Number.isInteger(options.port)) {
      this.port = options.port;
    }

    if (typeof options.host === 'string' && options.host.length > 0) {
      this.host = options.host;
    }

    if (!this.app) {
      this.app = this.createApp();
    }

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, this.host, () => {
        resolve({
          host: this.host,
          port: this.port,
          route: this.route
        });
      });
    });
  }

  stop() {
    if (!this.server) {
      return Promise.resolve(false);
    }

    const activeServer = this.server;
    this.server = null;

    return new Promise((resolve, reject) => {
      activeServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(true);
      });
    });
  }
}

module.exports = {
  ExpressJsonRpcTransport
};

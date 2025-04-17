// --- Server-Side Monitoring (Day 14) ---
const promClient = require('prom-client');
const express = require('express');

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'velo_' });

const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'velo_http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const apiErrorCounter = new promClient.Counter({
  name: 'velo_api_errors_total',
  help: 'Total count of API errors',
  labelNames: ['method', 'route', 'error_type']
});

const activeUsersGauge = new promClient.Gauge({
  name: 'velo_active_users',
  help: 'Number of active users'
});

function requestDurationMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    if (res.statusCode >= 400) {
      apiErrorCounter
        .labels(req.method, route, res.statusCode >= 500 ? 'server_error' : 'client_error')
        .inc();
    }
  });
  next();
}

function setupMetricsEndpoint(app) {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  });
}

function trackActiveUsers(io) {
  let connectedClients = 0;
  io.on('connection', socket => {
    connectedClients++;
    activeUsersGauge.set(connectedClients);
    socket.on('disconnect', () => {
      connectedClients--;
      activeUsersGauge.set(connectedClients);
    });
  });
}

module.exports = {
  requestDurationMiddleware,
  setupMetricsEndpoint,
  trackActiveUsers,
  metrics: {
    httpRequestDurationMicroseconds,
    apiErrorCounter,
    activeUsersGauge
  }
};

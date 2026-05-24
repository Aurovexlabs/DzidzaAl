const client = require("prom-client");

client.collectDefaultMetrics({ prefix: "dzidzaai_" });

const httpRequestsTotal = new client.Counter({
  name: "dzidzaai_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});

const httpRequestDuration = new client.Histogram({
  name: "dzidzaai_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

const queueJobsTotal = new client.Counter({
  name: "dzidzaai_queue_jobs_total",
  help: "Total queue jobs processed",
  labelNames: ["queue", "status"],
});

const queueJobDuration = new client.Histogram({
  name: "dzidzaai_queue_job_duration_seconds",
  help: "Queue job duration in seconds",
  labelNames: ["queue"],
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
});

const recordHttpRequest = ({ method, route, status, durationSeconds }) => {
  const labels = {
    method,
    route,
    status: String(status),
  };
  httpRequestsTotal.inc(labels);
  httpRequestDuration.observe(labels, durationSeconds);
};

const recordQueueJob = ({ queue, status, durationSeconds }) => {
  queueJobsTotal.inc({ queue, status });
  if (typeof durationSeconds === "number") {
    queueJobDuration.observe({ queue }, durationSeconds);
  }
};

const metricsRegistry = client.register;

module.exports = {
  metricsRegistry,
  recordHttpRequest,
  recordQueueJob,
};

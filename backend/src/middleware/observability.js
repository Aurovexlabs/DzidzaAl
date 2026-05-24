const crypto = require("crypto");
const { recordHttpRequest } = require("../utils/metrics");

const requestId = (req, res, next) => {
  const headerId = req.headers["x-request-id"];
  const id =
    typeof headerId === "string" && headerId.trim()
      ? headerId.trim()
      : crypto.randomUUID();

  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
};

const requestMetrics = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
    const route = req.route?.path || req.path || "unknown";
    recordHttpRequest({
      method: req.method,
      route,
      status: res.statusCode,
      durationSeconds,
    });
  });
  next();
};

module.exports = { requestId, requestMetrics };

const { Worker, QueueEvents } = require("bullmq");
const { env } = require("../config/env");
const { processDocumentJob } = require("../services/documentProcessingService");
const { recordQueueJob } = require("../utils/metrics");

let worker;
let queueEvents;

const createConnection = () => ({
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
});

const startDocumentWorker = () => {
  if (!env.REDIS_URL) return null;
  if (worker) return worker;

  queueEvents = new QueueEvents("document-processing", {
    connection: createConnection(),
  });

  worker = new Worker(
    "document-processing",
    async (job) => processDocumentJob(job.data, job),
    {
      connection: createConnection(),
      concurrency: 3,
    },
  );

  worker.on("completed", (job) => {
    const durationSeconds =
      typeof job.processedOn === "number" && typeof job.finishedOn === "number"
        ? (job.finishedOn - job.processedOn) / 1000
        : undefined;
    recordQueueJob({
      queue: "document-processing",
      status: "completed",
      durationSeconds,
    });
    console.log(`[QUEUE] Document job completed: ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    recordQueueJob({
      queue: "document-processing",
      status: "failed",
    });
    console.error(`[QUEUE] Document job failed: ${job?.id}`, err.message);
  });

  queueEvents.on("error", (err) => {
    console.error("[QUEUE] Document queue error:", err.message);
  });

  return worker;
};

if (require.main === module) {
  startDocumentWorker();
}

module.exports = { startDocumentWorker };

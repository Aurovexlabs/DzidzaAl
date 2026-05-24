const { Queue } = require("bullmq");
const { env } = require("../config/env");

let documentQueue;

const createConnection = () => ({
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
});

const getDocumentQueue = () => {
  if (!env.REDIS_URL) return null;
  if (!documentQueue) {
    documentQueue = new Queue("document-processing", {
      connection: createConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }
  return documentQueue;
};

const enqueueDocumentProcessing = async (payload) => {
  const queue = getDocumentQueue();
  if (!queue) return null;

  return queue.add("process-document", payload, {
    jobId: payload.docId,
    priority: 1,
  });
};

module.exports = {
  getDocumentQueue,
  enqueueDocumentProcessing,
};

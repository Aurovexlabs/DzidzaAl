const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { env } = require("../config/env");

const localUploadsDir = path.join(__dirname, "../../uploads");

const ensureLocalUploadsDir = () => {
  if (!fs.existsSync(localUploadsDir)) {
    fs.mkdirSync(localUploadsDir, { recursive: true });
  }
  return localUploadsDir;
};

const hasObjectStorage = () =>
  Boolean(
    env.S3_BUCKET &&
    env.S3_REGION &&
    env.S3_ACCESS_KEY_ID &&
    env.S3_SECRET_ACCESS_KEY,
  );

let s3Client;

const getS3Client = () => {
  if (!hasObjectStorage()) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle:
        env.S3_FORCE_PATH_STYLE === "true" || Boolean(env.S3_ENDPOINT),
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

const normalizeFileName = (originalName) =>
  originalName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();

const buildObjectKey = ({ userId, documentId, originalName }) => {
  const safeName = normalizeFileName(originalName || "upload.bin");
  return `documents/${userId}/${documentId || crypto.randomUUID()}/${Date.now()}-${safeName}`;
};

const createUploadUrl = async ({ key, contentType }) => {
  const client = getS3Client();
  if (!client) return null;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: 900 });
};

const createDownloadUrl = async ({ key }) => {
  const client = getS3Client();
  if (!client) return null;

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: 900 });
};

const uploadFile = async ({ key, filePath, contentType }) => {
  const client = getS3Client();
  if (!client) return null;

  const body = await fs.promises.readFile(filePath);
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
};

const downloadObjectToFile = async ({ key, filePath }) => {
  const client = getS3Client();
  if (!client) return null;

  const response = await client.send(
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }),
  );

  const writable = fs.createWriteStream(filePath);
  await new Promise((resolve, reject) => {
    response.Body.pipe(writable);
    response.Body.on("error", reject);
    writable.on("finish", resolve);
    writable.on("error", reject);
  });

  return filePath;
};

const headObject = async ({ key }) => {
  const client = getS3Client();
  if (!client) return null;

  return client.send(
    new HeadObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }),
  );
};

const deleteObject = async ({ key }) => {
  const client = getS3Client();
  if (!client) return null;

  return client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }),
  );
};

const removeLocalFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (_) {}
};

module.exports = {
  hasObjectStorage,
  getS3Client,
  ensureLocalUploadsDir,
  buildObjectKey,
  createUploadUrl,
  createDownloadUrl,
  uploadFile,
  downloadObjectToFile,
  headObject,
  deleteObject,
  removeLocalFile,
};

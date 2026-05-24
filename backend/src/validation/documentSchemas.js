const { z } = require("zod");

const documentUploadInitSchema = z.object({
  title: z.string().trim().min(1).max(200),
  originalName: z.string().trim().min(1).max(255),
  fileType: z.enum(["pdf", "txt", "docx"]),
  fileSize: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(25 * 1024 * 1024),
  subject: z.string().trim().max(120).optional(),
  contentType: z.string().trim().min(1).optional(),
});

const documentUploadCompleteSchema = z.object({
  documentId: z.string().trim().min(1),
});

module.exports = {
  documentUploadInitSchema,
  documentUploadCompleteSchema,
};

const mongoose = require("mongoose");

const subjectSelectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      enum: ["subject", "course", "module", "certification_topic", "other"],
      default: "subject",
    },
    isCustom: { type: Boolean, default: false },
    semester: { type: String, trim: true },
    code: { type: String, trim: true },
    masteryScore: { type: Number, default: 0, min: 0, max: 100 },
    hoursStudied: { type: Number, default: 0 },
    lastStudied: Date,
  },
  { _id: false },
);

const academicProfileSchema = new mongoose.Schema(
  {
    track: {
      type: String,
      enum: [
        "Primary School",
        "Secondary School",
        "O-Level",
        "A-Level",
        "College",
        "University",
        "Professional Certification",
        "Other",
      ],
      default: "Other",
    },
    school: {
      name: { type: String, trim: true },
      country: { type: String, trim: true },
      curriculum: { type: String, trim: true },
      currentGradeFormYear: { type: String, trim: true },
    },
    institution: {
      name: { type: String, trim: true },
      country: { type: String, trim: true },
      facultySchool: { type: String, trim: true },
    },
    program: {
      degreeProgram: { type: String, trim: true },
      major: { type: String, trim: true },
      specialization: { type: String, trim: true },
      yearOfStudy: { type: String, trim: true },
      semester: { type: String, trim: true },
    },
    certification: {
      name: { type: String, trim: true },
      provider: { type: String, trim: true },
      examLevel: { type: String, trim: true },
    },
    curriculumMetadata: {
      system: { type: String, trim: true },
      board: { type: String, trim: true },
      region: { type: String, trim: true },
    },
    academicInterests: [{ type: String, trim: true }],
    academicGoals: [{ type: String, trim: true }],
    preferences: {
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "intermediate",
      },
      tutoringStyle: {
        type: String,
        enum: ["guided", "exam_focused", "visual", "practice_first"],
        default: "guided",
      },
      responseDepth: {
        type: String,
        enum: ["concise", "balanced", "detailed"],
        default: "balanced",
      },
    },
    notes: { type: String, trim: true },
    lastCompletedStep: { type: String, trim: true },
    completedAt: Date,
  },
  { _id: false },
);

module.exports = {
  subjectSelectionSchema,
  academicProfileSchema,
};

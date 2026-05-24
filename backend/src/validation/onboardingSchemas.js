const { z } = require("zod");

const educationLevel = z.enum([
  "Primary School",
  "Secondary School",
  "ZJC",
  "O-Level",
  "A-Level",
  "College",
  "University",
  "Professional Certification",
  "Other",
]);

const stringList = z.array(z.string().trim().min(1)).default([]);

const onboardingDraftSchema = z
  .object({
    educationLevel: educationLevel.optional(),
    schoolName: z.string().trim().optional(),
    country: z.string().trim().optional(),
    curriculum: z.string().trim().optional(),
    currentGradeFormYear: z.string().trim().optional(),
    institutionName: z.string().trim().optional(),
    facultySchool: z.string().trim().optional(),
    degreeProgram: z.string().trim().optional(),
    major: z.string().trim().optional(),
    specialization: z.string().trim().optional(),
    yearOfStudy: z.string().trim().optional(),
    semester: z.string().trim().optional(),
    certificationName: z.string().trim().optional(),
    certificationProvider: z.string().trim().optional(),
    examLevel: z.string().trim().optional(),
    curriculumSystem: z.string().trim().optional(),
    curriculumBoard: z.string().trim().optional(),
    subjects: stringList,
    courseModules: stringList,
    modules: stringList,
    academicInterests: stringList,
    academicGoals: stringList,
    preferredDifficulty: z
      .enum(["beginner", "intermediate", "advanced"])
      .optional(),
    tutoringStyle: z
      .enum(["guided", "exam_focused", "visual", "practice_first"])
      .optional(),
    responseDepth: z.enum(["concise", "balanced", "detailed"]).optional(),
    notes: z.string().trim().optional(),
    completed: z.boolean().optional(),
  })
  .passthrough();

module.exports = {
  onboardingDraftSchema,
};

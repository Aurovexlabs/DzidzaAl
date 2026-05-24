const Ajv = require("ajv");

const ajv = new Ajv({
  allErrors: true,
  allowUnionTypes: true,
  coerceTypes: false,
});

const schemas = {
  quiz: {
    type: "object",
    required: ["questions"],
    additionalProperties: false,
    properties: {
      questions: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["text", "options", "correctAnswer"],
          additionalProperties: true,
          properties: {
            text: { type: "string", minLength: 1 },
            options: { type: "array", minItems: 2, items: { type: "string" } },
            correctAnswer: { type: "string", minLength: 1 },
            explanation: { type: "string" },
            difficulty: { type: "string" },
            topic: { type: "string" },
          },
        },
      },
    },
  },
  flashcards: {
    type: "object",
    required: ["flashcards"],
    additionalProperties: false,
    properties: {
      flashcards: {
        type: "array",
        items: {
          type: "object",
          required: ["front", "back"],
          additionalProperties: true,
          properties: {
            front: { type: "string", minLength: 1 },
            back: { type: "string", minLength: 1 },
            topic: { type: "string" },
          },
        },
      },
    },
  },
  exam: {
    type: "object",
    required: ["questions", "title"],
    additionalProperties: true,
    properties: {
      title: { type: "string" },
      instructions: { type: "string" },
      timeLimitMinutes: { type: "number" },
      totalMarks: { type: "number" },
      questions: { type: "array", minItems: 1 },
    },
  },
  learningPath: {
    type: "object",
    required: ["milestones"],
    additionalProperties: true,
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      totalEstimatedHours: { type: "number" },
      milestones: { type: "array", minItems: 1 },
    },
  },
  knowledgeGaps: {
    type: "object",
    required: [
      "criticalGaps",
      "moderateGaps",
      "strongAreas",
      "recommendedFocus",
      "studyStrategy",
    ],
    additionalProperties: true,
    properties: {
      criticalGaps: { type: "array", items: { type: "string" } },
      moderateGaps: { type: "array", items: { type: "string" } },
      strongAreas: { type: "array", items: { type: "string" } },
      recommendedFocus: { type: "array", items: { type: "string" } },
      studyStrategy: { type: "string" },
    },
  },
  practiceProblems: {
    type: "object",
    required: ["problems"],
    additionalProperties: true,
    properties: {
      problems: {
        type: "array",
        items: {
          type: "object",
          required: ["question", "solution"],
          additionalProperties: true,
          properties: {
            question: { type: "string" },
            solution: { type: "string" },
            marks: { type: "number" },
            difficulty: { type: "string" },
            hints: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
};

const validators = Object.fromEntries(
  Object.entries(schemas).map(([name, schema]) => [name, ajv.compile(schema)]),
);

const assertAiOutput = (name, payload) => {
  const validate = validators[name];
  if (!validate) return payload;
  if (!validate(payload)) {
    const message = ajv.errorsText(validate.errors, { separator: "; " });
    throw new Error(`Invalid AI output for ${name}: ${message}`);
  }
  return payload;
};

module.exports = { assertAiOutput };

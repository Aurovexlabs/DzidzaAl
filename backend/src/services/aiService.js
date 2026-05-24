"use strict";
/**
 * DzidzaAI AI Service
 * All AI calls route through aiProvider.js — OpenAI / Gemini / DeepSeek with failover.
 */

const {
  complete,
  completeJSON,
  completeWithCache,
  embedMany,
  embedText,
} = require("../config/aiProvider");
const { assertAiOutput } = require("../utils/aiSchemas");

const LANGUAGE_INSTRUCTIONS = {
  english: "Respond in clear, academic English.",
  shona:
    "Respond in Shona (ChiShona). Use simple, clear language suitable for students.",
  ndebele:
    "Respond in Ndebele (isiNdebele). Use simple, clear language suitable for students.",
};

const LEVEL_CONTEXT = {
  ZJC: "Zimbabwe Junior Certificate (ZJC) level, ages 13-14",
  "O-Level": "Zimbabwe O-Level (ZIMSEC), ages 15-16",
  "A-Level": "Zimbabwe A-Level (ZIMSEC), ages 17-18",
  University: "University undergraduate level",
};

const lvl = (l) => LEVEL_CONTEXT[l] || LEVEL_CONTEXT["O-Level"];
const lang = (l) => LANGUAGE_INSTRUCTIONS[l] || LANGUAGE_INSTRUCTIONS.english;

const buildAcademicContext = (user = {}) => {
  const profile = user.academicProfile || {};
  const sections = [];

  if (profile.track) sections.push(`Education track: ${profile.track}`);
  if (profile.school?.name) {
    sections.push(
      `School: ${profile.school.name}${profile.school.country ? `, ${profile.school.country}` : ""}${profile.school.curriculum ? `, curriculum: ${profile.school.curriculum}` : ""}`,
    );
  }
  if (profile.institution?.name) {
    sections.push(
      `Institution: ${profile.institution.name}${profile.institution.country ? `, ${profile.institution.country}` : ""}${profile.institution.facultySchool ? `, faculty/school: ${profile.institution.facultySchool}` : ""}`,
    );
  }
  if (profile.program?.degreeProgram) {
    sections.push(
      `Program: ${profile.program.degreeProgram}${profile.program.major ? `, major: ${profile.program.major}` : ""}${profile.program.specialization ? `, specialization: ${profile.program.specialization}` : ""}${profile.program.yearOfStudy ? `, year: ${profile.program.yearOfStudy}` : ""}${profile.program.semester ? `, semester: ${profile.program.semester}` : ""}`,
    );
  }
  if (profile.certification?.name) {
    sections.push(
      `Certification: ${profile.certification.name}${profile.certification.provider ? `, provider: ${profile.certification.provider}` : ""}${profile.certification.examLevel ? `, level: ${profile.certification.examLevel}` : ""}`,
    );
  }
  if (profile.curriculumMetadata?.system || profile.curriculumMetadata?.board) {
    sections.push(
      `Curriculum metadata: ${[profile.curriculumMetadata.system, profile.curriculumMetadata.board, profile.curriculumMetadata.region].filter(Boolean).join(" | ")}`,
    );
  }
  if ((user.subjects || []).length) {
    sections.push(
      `Active subjects/courses: ${(user.subjects || []).map((item) => item.name).join(", ")}`,
    );
  }
  if (profile.academicInterests?.length) {
    sections.push(
      `Academic interests: ${profile.academicInterests.join(", ")}`,
    );
  }
  if (profile.academicGoals?.length) {
    sections.push(`Academic goals: ${profile.academicGoals.join(", ")}`);
  }
  if (profile.preferences) {
    sections.push(
      `Learning preferences: difficulty=${profile.preferences.difficulty || "intermediate"}, style=${profile.preferences.tutoringStyle || "guided"}, depth=${profile.preferences.responseDepth || "balanced"}`,
    );
  }

  return sections.join("\n");
};

const pickLabel = (value, fallback) =>
  (value && String(value).trim()) || fallback;

const buildMultipleChoiceOptions = (correctText, distractors) =>
  [correctText, ...distractors].map(
    (text, index) => `${String.fromCharCode(65 + index)}. ${text}`,
  );

const buildFallbackQuiz = ({ subject, topic, difficulty, count }) => {
  const topicLabel = pickLabel(topic, subject || "the topic");
  const subjectLabel = pickLabel(subject, "the subject");
  const questionCount = Math.max(1, Math.min(Number(count) || 10, 20));
  const stems = [
    "best describes the idea",
    "is the most accurate statement",
    "helps explain the concept",
    "is an example of the concept",
  ];

  return {
    questions: Array.from({ length: questionCount }, (_, index) => {
      const stem = stems[index % stems.length];
      const correct = `It refers to a key principle of ${topicLabel} in ${subjectLabel}`;
      const questionText = `Which option ${stem} for ${topicLabel} in ${subjectLabel}?`;

      return {
        text: questionText,
        type: "multiple_choice",
        options: buildMultipleChoiceOptions(correct, [
          `It has no connection to ${subjectLabel}`,
          `It only matters when memorising definitions`,
          `It is unrelated to exam preparation`,
        ]),
        correctAnswer: `A. ${correct}`,
        explanation: `The correct choice captures the core meaning of ${topicLabel}.`,
        difficulty,
        topic: topicLabel,
        subject: subjectLabel,
      };
    }),
  };
};

const buildFallbackExam = ({
  subject,
  educationLevel,
  year,
  paper,
  questionTypes,
  totalMarks,
}) => {
  const subjectLabel = pickLabel(subject, "the subject");
  const examTypes =
    Array.isArray(questionTypes) && questionTypes.length
      ? questionTypes
      : ["mcq", "short_answer", "essay"];
  const sequence = [];

  if (examTypes.length === 1) {
    const repeatedType = examTypes[0];
    for (let index = 0; index < 8; index += 1) sequence.push(repeatedType);
  } else {
    const counts = {
      mcq: 4,
      short_answer: 3,
      essay: 2,
    };

    for (const type of examTypes) {
      const repeats = counts[type] || 2;
      for (let index = 0; index < repeats; index += 1) {
        sequence.push(type);
      }
    }
  }

  const baseMarks = {
    mcq: 1,
    short_answer: 5,
    essay: 15,
  };

  const targetMarks = Number(totalMarks) || 100;
  const baseTotal =
    sequence.reduce((sum, type) => sum + (baseMarks[type] || 5), 0) || 1;
  const scale = targetMarks / baseTotal;

  const questions = sequence.map((type, index) => {
    const number = index + 1;
    const marks = Math.max(1, Math.round((baseMarks[type] || 5) * scale));
    const topicLabel =
      year || paper ? `${year || ""} ${paper || ""}`.trim() : "this paper";

    if (type === "essay") {
      return {
        text: `Discuss ${subjectLabel} in the context of ${topicLabel} and explain its importance.`,
        type: "essay",
        marks,
        topic: subjectLabel,
        correctAnswer: `A strong answer should define the concept, explain key features, and link them to ${subjectLabel}.`,
        markingGuide: `Award marks for clear structure, accurate content, and relevant examples about ${subjectLabel}.`,
      };
    }

    if (type === "short_answer") {
      return {
        text: `Briefly explain the main idea behind ${subjectLabel} question ${number} for ${topicLabel}.`,
        type: "short_answer",
        marks,
        topic: subjectLabel,
        correctAnswer: `A concise answer should state the key idea and give one relevant detail about ${subjectLabel}.`,
        markingGuide: `Look for the central definition, one supporting point, and correct terminology.`,
      };
    }

    const correct = `It is the correct principle related to ${subjectLabel}`;
    return {
      text: `Which statement best applies to ${subjectLabel} question ${number} in ${topicLabel}?`,
      type: "mcq",
      options: buildMultipleChoiceOptions(correct, [
        `It is unrelated to ${subjectLabel}`,
        `It only applies after the exam starts`,
        `It is never assessed in practice`,
      ]),
      correctAnswer: `A. ${correct}`,
      marks,
      topic: subjectLabel,
      markingGuide: `Choose the option that matches the core principle of ${subjectLabel}.`,
    };
  });

  const adjustedTotal = questions.reduce(
    (sum, question) => sum + (question.marks || 1),
    0,
  );
  const difference = targetMarks - adjustedTotal;
  if (questions.length && difference !== 0) {
    const lastQuestion = questions[questions.length - 1];
    lastQuestion.marks = Math.max(1, (lastQuestion.marks || 1) + difference);
  }

  const finalTotal = questions.reduce(
    (sum, question) => sum + (question.marks || 1),
    0,
  );

  return {
    title: `${subjectLabel} ${paper || "Exam"}`.trim(),
    instructions:
      "Answer all questions clearly. Use full sentences where appropriate and show working for structured questions.",
    timeLimitMinutes: 180,
    totalMarks: finalTotal,
    questions,
    isFallback: true,
    educationLevel,
  };
};

const buildFallbackGradeings = (tasks) =>
  tasks.map((task) => {
    const wordCount = String(task.answer || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const maxScore = Number(task.marks) || 10;
    const ratio =
      wordCount >= 140
        ? 0.85
        : wordCount >= 80
          ? 0.7
          : wordCount >= 35
            ? 0.5
            : 0.25;
    const score = Math.min(maxScore, Math.max(0, Math.round(maxScore * ratio)));

    return {
      questionText: task.question,
      score,
      maxScore,
      feedback:
        score >= maxScore * 0.7
          ? "Good coverage with relevant detail and clear structure."
          : score >= maxScore * 0.4
            ? "A reasonable answer, but it needs more specific explanation and examples."
            : "The response is too brief. Expand the main idea, add examples, and connect it to the question.",
      keyPointsMissed: String(task.guide || "")
        .split(/[.;\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3),
    };
  });

const parseStructuredJson = (value, label) => {
  if (!value) {
    throw new Error(`AI returned empty ${label}`);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    try {
      return JSON.parse(trimmed);
    } catch (_) {
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fenced) return JSON.parse(fenced[1].trim());
      throw new Error(`Malformed JSON returned for ${label}`);
    }
  }

  return value;
};

// ─── 1. TUTOR CHAT ────────────────────────────────────────────────────────────
const chatWithTutor = async ({
  messages,
  subject,
  educationLevel,
  language = "english",
  userName,
  academicProfile,
}) => {
  const system = [
    `You are DzidzaAI, a personal academic tutor for Zimbabwean students.`,
    `Student: ${userName}, studying at ${lvl(educationLevel)}${subject ? `, focusing on ${subject}` : ""}.`,
    academicProfile ? buildAcademicContext({ academicProfile }) : "",
    lang(language),
    `Guidelines: tailor to ${lvl(educationLevel)}, reference ZIMSEC curriculum, use worked examples, be encouraging.`,
  ].join("\n");

  const result = await complete(
    [{ role: "system", content: system }, ...messages],
    { maxTokens: 1400, temperature: 0.7 },
  );
  return {
    content: result.content,
    tokensUsed: result.tokensUsed,
    provider: result.provider,
  };
};

// ─── 2. QUIZ GENERATION ───────────────────────────────────────────────────────
const generateQuiz = async ({
  subject,
  topic,
  educationLevel,
  difficulty = "medium",
  count = 10,
  context = "",
  academicProfile,
}) => {
  const prompt = [
    `Generate ${count} ${difficulty}-difficulty multiple-choice questions for a ${lvl(educationLevel)} student.`,
    `Subject: ${subject}${topic ? `, Topic: ${topic}` : ""}`,
    academicProfile ? buildAcademicContext({ academicProfile }) : "",
    context ? `Context:\n${context}` : "",
    `Return JSON: { "questions": [{ "text": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctAnswer": "A. ...", "explanation": "...", "difficulty": "${difficulty}", "topic": "..." }] }`,
  ]
    .filter(Boolean)
    .join("\n");

  const cacheKey = `quiz:${subject}:${topic}:${difficulty}:${count}:${educationLevel}`;
  try {
    const result = await completeWithCache(
      cacheKey,
      [{ role: "user", content: prompt }],
      {
        maxTokens: 3500,
        temperature: 0.6,
        json: true,
      },
    );
    const data = parseStructuredJson(result.data || result.content, "quiz");
    const validated = assertAiOutput("quiz", data);
    return (validated.questions || []).slice(0, count);
  } catch (err) {
    console.warn(
      `[AI] Falling back to deterministic quiz generation: ${err.message}`,
    );
    return buildFallbackQuiz({ subject, topic, difficulty, count }).questions;
  }
};

// ─── 3. DOCUMENT SUMMARY ─────────────────────────────────────────────────────
const summarizeDocument = async (text, subject, educationLevel) => {
  const result = await complete(
    [
      {
        role: "user",
        content: `Summarize this academic document for a ${lvl(educationLevel)} student studying ${subject || "general subjects"}.\nProvide: 3-5 paragraph summary, key concepts list, main topics, important formulas.\n\nDocument:\n${text.slice(0, 8000)}`,
      },
    ],
    { maxTokens: 1200, temperature: 0.5 },
  );
  return result.content;
};

// ─── 4. FLASHCARD GENERATION ──────────────────────────────────────────────────
const generateFlashcards = async (text, subject, count = 15) => {
  const prompt = `Generate ${count} flashcards from this academic text about ${subject || "this subject"}.\nReturn JSON: { "flashcards": [{ "front": "Term/question", "back": "Definition/answer", "topic": "..." }] }\n\nText:\n${text.slice(0, 6000)}`;
  const result = await completeJSON(prompt, {
    maxTokens: 2500,
    temperature: 0.5,
  });
  const data = parseStructuredJson(result.data || result.content, "flashcards");
  const validated = assertAiOutput("flashcards", data);
  return (validated.flashcards || []).slice(0, count);
};

// ─── 5. TIMETABLE OPTIMIZATION ───────────────────────────────────────────────
const optimizeTimetable = async ({
  subjects,
  freeSlots,
  performanceData,
  educationLevel,
  academicProfile,
}) => {
  const prompt = [
    `Optimize a weekly study schedule for a Zimbabwean ${educationLevel} student.`,
    academicProfile ? buildAcademicContext({ academicProfile }) : "",
    `Subjects: ${subjects.map((s) => `${s.name} (mastery:${s.masteryScore}%)`).join(", ")}`,
    `Free slots: ${freeSlots.map((s) => `${s.day} ${s.startTime}-${s.endTime}`).join(", ")}`,
    `Priority: weak subjects first, mornings for hard subjects, spaced repetition.`,
    `Return JSON: { "schedule": [{ "day": "Monday", "startTime": "08:00", "endTime": "09:30", "subject": "...", "type": "study", "notes": "..." }], "insights": ["..."] }`,
  ].join("\n");
  const result = await completeJSON(prompt, {
    maxTokens: 2500,
    temperature: 0.4,
  });
  return parseStructuredJson(result.data || result.content, "timetable");
};

// ─── 6. AI COACH MESSAGE ─────────────────────────────────────────────────────
const generateCoachMessage = async ({
  userName,
  performanceData,
  streak,
  weakSubjects,
  language = "english",
}) => {
  const result = await complete(
    [
      {
        role: "user",
        content: `${lang(language)}\nWrite a short motivational coaching message (under 60 words) for ${userName}.\nStreak: ${streak} days. Weak subjects: ${weakSubjects.join(", ") || "none"}. Performance: ${JSON.stringify(performanceData)}.\nBe specific, encouraging, action-oriented. Sound like a caring human tutor.`,
      },
    ],
    { maxTokens: 150, temperature: 0.85 },
  );
  return result.content;
};

// ─── 7. EXAM GENERATION ──────────────────────────────────────────────────────
const generateExam = async ({
  subject,
  educationLevel,
  year,
  paper,
  questionTypes = ["mcq", "short_answer", "essay"],
  totalMarks = 100,
  academicProfile,
}) => {
  const prompt = [
    `Generate a realistic ZIMSEC ${educationLevel} ${subject} exam${year ? ` (${year})` : ""}${paper ? ` - ${paper}` : ""}.`,
    academicProfile ? buildAcademicContext({ academicProfile }) : "",
    `Total marks: ${totalMarks}. Types: ${questionTypes.join(", ")}.`,
    `Use real ZIMSEC structure: Section A (MCQ 1mk each), Section B (short 3-8mk), Section C (essay 10-20mk).`,
    `Return JSON: { "title": "...", "instructions": "...", "timeLimitMinutes": 180, "totalMarks": ${totalMarks}, "questions": [{ "text": "...", "type": "mcq|short_answer|essay", "options": [...], "correctAnswer": "...", "marks": 1, "topic": "...", "markingGuide": "..." }] }`,
  ].join("\n");
  try {
    const result = await completeJSON(prompt, {
      maxTokens: 4500,
      temperature: 0.5,
    });
    const data = parseStructuredJson(result.data || result.content, "exam");
    return assertAiOutput("exam", data);
  } catch (err) {
    console.warn(
      `[AI] Falling back to deterministic exam generation: ${err.message}`,
    );
    return buildFallbackExam({
      subject,
      educationLevel,
      year,
      paper,
      questionTypes,
      totalMarks,
    });
  }
};

// ─── 8. GRADE EXAM ANSWERS ────────────────────────────────────────────────────
const gradeExamAnswers = async ({
  questions,
  answers,
  subject,
  educationLevel,
}) => {
  const tasks = answers
    .filter((a) => a.type !== "mcq")
    .map((a) => {
      const q = questions.find(
        (q) =>
          q._id?.toString() === a.questionId?.toString() ||
          q.text === a.questionText,
      );
      return q
        ? {
            question: q.text,
            answer: a.userAnswer,
            marks: q.marks,
            guide: q.markingGuide,
          }
        : null;
    })
    .filter(Boolean);
  if (!tasks.length) return [];

  const prompt = [
    `You are a ZIMSEC ${subject} examiner (${lvl(educationLevel)}). Grade these answers.`,
    `Return JSON: { "gradings": [{ "questionText": "...", "score": 7, "maxScore": 10, "feedback": "...", "keyPointsMissed": [] }] }`,
    `Answers:\n${tasks.map((t, i) => `${i + 1}. Q(${t.marks}m): ${t.question}\nGuide: ${t.guide || "use knowledge"}\nAnswer: ${t.answer}`).join("\n\n")}`,
  ].join("\n");
  try {
    const result = await completeJSON(prompt, {
      maxTokens: 2500,
      temperature: 0.3,
    });
    const data = parseStructuredJson(
      result.data || result.content,
      "exam grading",
    );
    return data.gradings || [];
  } catch (err) {
    console.warn(`[AI] Falling back to heuristic exam grading: ${err.message}`);
    return buildFallbackGradeings(tasks);
  }
};

// ─── 9. EXAM PERFORMANCE ANALYSIS ────────────────────────────────────────────
const analyzeExamPerformance = async ({
  subject,
  educationLevel,
  percentage,
  grade,
  weakTopics,
  answers,
}) => {
  const fallbackWeakTopics = weakTopics?.length
    ? weakTopics.join(", ")
    : "no major gaps";
  const fallbackFocus = weakTopics?.length
    ? `Prioritise ${weakTopics[0]} and build from there.`
    : "Keep practising mixed questions to maintain consistency.";

  try {
    const result = await complete(
      [
        {
          role: "user",
          content: `Analyse this ${educationLevel} ${subject} exam: ${percentage}% (${grade}). Weak topics: ${fallbackWeakTopics}. ${answers.length} questions.\nWrite 3-4 sentences: what they did well, what needs work, study recommendations, real exam prep tips. Direct and motivating.`,
        },
      ],
      { maxTokens: 400, temperature: 0.75 },
    );
    return result.content;
  } catch (err) {
    console.warn(
      `[AI] Falling back to deterministic exam analysis: ${err.message}`,
    );
    return [
      `You scored ${percentage}% (${grade}) in ${subject} at ${educationLevel} level.`,
      `Main improvement area: ${fallbackWeakTopics}.`,
      fallbackFocus,
      "Revise the tested topics again with timed practice and mark your answers against the syllabus.",
    ].join(" ");
  }
};

// ─── 10. ESSAY GRADER ────────────────────────────────────────────────────────
const gradeEssay = async ({
  question,
  answer,
  subject,
  educationLevel,
  maxMarks = 20,
}) => {
  const prompt = [
    `You are a ZIMSEC ${subject} examiner (${lvl(educationLevel)}). Grade this essay.`,
    `Question (${maxMarks}m): ${question}`,
    `Answer: ${answer}`,
    `Return JSON: { "earnedMarks": 14, "percentage": 70, "grade": "B", "criteria": [{ "name": "Content & Knowledge", "maxMarks": ${Math.round(maxMarks * 0.5)}, "earnedMarks": 7, "feedback": "..." }, { "name": "Structure & Organisation", "maxMarks": ${Math.round(maxMarks * 0.25)}, "earnedMarks": 4, "feedback": "..." }, { "name": "Language & Expression", "maxMarks": ${Math.round(maxMarks * 0.25)}, "earnedMarks": 3, "feedback": "..." }], "overallFeedback": "...", "strengths": [], "improvements": [], "modelAnswer": "...", "wordCount": ${answer.split(/\s+/).length} }`,
  ].join("\n");
  const result = await completeJSON(prompt, {
    maxTokens: 2000,
    temperature: 0.3,
  });
  return result.data;
};

// ─── 11. LEARNING PATH ───────────────────────────────────────────────────────
const generateLearningPath = async ({
  subject,
  educationLevel,
  currentMastery,
  targetExamDate,
  weakTopics,
  hoursPerDay,
  academicProfile,
}) => {
  const days = targetExamDate
    ? Math.max(
        1,
        Math.round((new Date(targetExamDate) - Date.now()) / 86400000),
      )
    : 90;
  const prompt = [
    `Create a ${subject} learning path for a ${lvl(educationLevel)} student. Mastery: ${currentMastery}%, Days to exam: ${days}, Hours/day: ${hoursPerDay || 2}.`,
    academicProfile ? buildAcademicContext({ academicProfile }) : "",
    `Weak topics: ${weakTopics.join(", ") || "to be assessed"}.`,
    `Return JSON with 8-12 sequential milestones: { "title": "...", "description": "...", "totalEstimatedHours": 60, "milestones": [{ "order": 1, "title": "...", "description": "...", "topic": "...", "estimatedHours": 5, "masteryRequired": 70, "prerequisites": [], "resources": [{ "type": "practice", "description": "..." }] }] }`,
    `Prioritise weak topics. Order from fundamentals to advanced.`,
  ].join("\n");
  const result = await completeJSON(prompt, {
    maxTokens: 3500,
    temperature: 0.5,
  });
  const data = parseStructuredJson(
    result.data || result.content,
    "learning path",
  );
  return assertAiOutput("learningPath", data);
};

// ─── 12. FOCUS SESSION ANALYSIS ──────────────────────────────────────────────
const analyseFocusSession = async ({
  subject,
  goal,
  pomodorosCompleted,
  totalMinutes,
  distractionCount,
  accomplishments,
}) => {
  const focusScore = Math.max(0, Math.min(100, 100 - distractionCount * 10));
  const result = await complete(
    [
      {
        role: "user",
        content: `Analyse study session (2-3 sentences): Subject: ${subject}, Goal: ${goal || "General"}, Pomodoros: ${pomodorosCompleted}, Time: ${totalMinutes}min, Distractions: ${distractionCount}, Score: ${focusScore}/100. Accomplishments: ${accomplishments || "none"}. Give practical feedback + one tip.`,
      },
    ],
    { maxTokens: 200, temperature: 0.75 },
  );
  return { feedback: result.content, focusScore };
};

// ─── 13. VOICE TRANSCRIPT ────────────────────────────────────────────────────
const processVoiceTranscript = async ({
  transcript,
  subject,
  educationLevel,
  language = "english",
  academicProfile,
}) => {
  const result = await complete(
    [
      {
        role: "system",
        content: `You are DzidzaAI, voice tutor for a ${lvl(educationLevel)} student studying ${subject || "general subjects"}. ${academicProfile ? buildAcademicContext({ academicProfile }) + "\n" : ""}${lang(language)} Keep responses conversational and concise for voice delivery.`,
      },
      { role: "user", content: transcript },
    ],
    { maxTokens: 600, temperature: 0.75 },
  );
  return result.content;
};

// ─── 14. KNOWLEDGE GAP ANALYSIS (new) ────────────────────────────────────────
const analyzeKnowledgeGaps = async ({
  subject,
  educationLevel,
  quizHistory,
  masteryData,
  academicProfile,
}) => {
  const prompt = [
    `Analyse knowledge gaps for a ${lvl(educationLevel)} ${subject} student.`,
    academicProfile ? buildAcademicContext({ academicProfile }) : "",
    `Quiz history: ${JSON.stringify(quizHistory.slice(0, 10))}`,
    `Mastery: ${JSON.stringify(masteryData)}`,
    `Return JSON: { "criticalGaps": [], "moderateGaps": [], "strongAreas": [], "recommendedFocus": [], "studyStrategy": "2-3 sentence personalised strategy" }`,
  ].join("\n");
  const result = await completeJSON(prompt, {
    maxTokens: 800,
    temperature: 0.4,
  });
  const data = parseStructuredJson(
    result.data || result.content,
    "knowledge gaps",
  );
  return assertAiOutput("knowledgeGaps", data);
};

// ─── 15. CONCEPT EXPLAINER (new) ─────────────────────────────────────────────
const explainConcept = async ({
  concept,
  subject,
  educationLevel,
  language = "english",
  style = "standard",
  academicProfile,
}) => {
  const styles = {
    standard: "Clear step-by-step with worked examples.",
    eli5: "Like I am 10 years old — simple analogies, everyday examples.",
    exam: "Concise exam-ready answer using ZIMSEC terminology.",
    visual: "Describe as if drawing on a whiteboard — use ASCII diagrams.",
  };
  const result = await complete(
    [
      {
        role: "system",
        content: `DzidzaAI tutor for ${lvl(educationLevel)} ${subject} student. ${academicProfile ? buildAcademicContext({ academicProfile }) + "\n" : ""}${lang(language)}`,
      },
      {
        role: "user",
        content: `Explain: "${concept}"\nStyle: ${styles[style] || styles.standard}`,
      },
    ],
    { maxTokens: 900, temperature: 0.65 },
  );
  return result.content;
};

// ─── 16. PRACTICE PROBLEM GENERATOR (new) ────────────────────────────────────
const generatePracticeProblems = async ({
  topic,
  subject,
  educationLevel,
  count = 5,
  includeWorkedSolution = true,
  academicProfile,
}) => {
  const prompt = [
    `Generate ${count} practice problems for ${lvl(educationLevel)} ${subject}, topic: "${topic}".`,
    academicProfile ? buildAcademicContext({ academicProfile }) : "",
    `Return JSON: { "problems": [{ "question": "...", "hints": ["..."], "solution": "${includeWorkedSolution ? "Full worked solution" : "Final answer"}", "marks": 3, "difficulty": "medium" }] }`,
    `Mix difficulty. Use ZIMSEC exam language and mark allocations.`,
  ].join("\n");
  const result = await completeJSON(prompt, {
    maxTokens: 3000,
    temperature: 0.6,
  });
  const data = parseStructuredJson(
    result.data || result.content,
    "practice problems",
  );
  const validated = assertAiOutput("practiceProblems", data);
  return validated.problems || [];
};

// ─── 17. STUDY NOTES GENERATOR (new) ─────────────────────────────────────────
const generateStudyNotes = async ({
  topic,
  subject,
  educationLevel,
  language = "english",
  academicProfile,
}) => {
  const result = await complete(
    [
      {
        role: "user",
        content: [
          `Generate comprehensive study notes on "${topic}" for a ${lvl(educationLevel)} ${subject} student. ${lang(language)}`,
          academicProfile ? buildAcademicContext({ academicProfile }) : "",
          `Format with these sections: Key Definitions | Core Concepts | Important Formulas/Rules | Common Exam Questions (with brief answers) | Memory Tips`,
          `Use clear headings and bullet points. Be thorough but concise.`,
        ].join("\n"),
      },
    ],
    { maxTokens: 1800, temperature: 0.6 },
  );
  return result.content;
};

// ─── 18. STUDY PARTNER MATCHING (algorithmic — no AI needed) ─────────────────
const computeMatchScore = (userA, userB) => {
  const setA = new Set((userA.subjects || []).map((s) => s.name));
  const setB = new Set((userB.subjects || []).map((s) => s.name));
  const shared = [...setA].filter((s) => setB.has(s));
  if (!shared.length) return { score: 0, sharedSubjects: [] };
  const subjectScore = (shared.length / Math.max(setA.size, setB.size)) * 50;
  const avgA =
    (userA.subjects || []).reduce((a, s) => a + s.masteryScore, 0) /
    Math.max(setA.size, 1);
  const avgB =
    (userB.subjects || []).reduce((a, s) => a + s.masteryScore, 0) /
    Math.max(setB.size, 1);
  const masteryScore = Math.max(0, 30 - Math.abs(avgA - avgB) * 0.5);
  const levelMatch = userA.educationLevel === userB.educationLevel ? 20 : 0;
  return {
    score: Math.min(100, Math.round(subjectScore + masteryScore + levelMatch)),
    sharedSubjects: shared,
  };
};

// ─── 19. ADAPTIVE DIFFICULTY ─────────────────────────────────────────────────
const adjustDifficulty = (current, recentScores) => {
  if (recentScores.length < 3) return current;
  const avg = recentScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
  if (avg >= 80 && current !== "hard")
    return current === "easy" ? "medium" : "hard";
  if (avg <= 40 && current !== "easy")
    return current === "hard" ? "medium" : "easy";
  return current;
};

module.exports = {
  chatWithTutor,
  explainConcept,
  processVoiceTranscript,
  generateQuiz,
  generateExam,
  generateFlashcards,
  generatePracticeProblems,
  generateStudyNotes,
  summarizeDocument,
  gradeExamAnswers,
  analyzeExamPerformance,
  gradeEssay,
  optimizeTimetable,
  generateLearningPath,
  generateCoachMessage,
  analyzeKnowledgeGaps,
  analyseFocusSession,
  computeMatchScore,
  adjustDifficulty,
  buildAcademicContext,
  embedMany,
  embedText,
};

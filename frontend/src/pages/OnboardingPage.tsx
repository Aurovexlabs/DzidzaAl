import {
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  ProgressBar,
  SectionHeader,
  Spinner,
} from "../components/ui";
import { onboardingApi, userApi } from "../services/apiServices";

import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import type { User } from "../types";

const LEVEL_OPTIONS: Array<User["educationLevel"]> = [
  "Primary School",
  "Secondary School",
  "O-Level",
  "A-Level",
  "College",
  "University",
  "Professional Certification",
  "Other",
];

const SCHOOL_SUGGESTIONS = [
  "Mathematics",
  "English",
  "Biology",
  "Physics",
  "Chemistry",
  "Geography",
  "History",
  "ICT",
  "Accounting",
  "Literature",
  "Agriculture",
  "Combined Science",
  "Business Studies",
];

const TERTIARY_SUGGESTIONS = [
  "Data Structures",
  "Operating Systems",
  "Calculus",
  "Database Systems",
  "Machine Learning",
  "Software Engineering",
  "Algorithms",
  "Computer Networks",
  "Discrete Mathematics",
  "Project Management",
  "Financial Accounting",
  "Business Law",
  "Human Anatomy",
  "Organic Chemistry",
];

const CERTIFICATION_SUGGESTIONS = [
  "Networking Fundamentals",
  "Cloud Concepts",
  "Security Principles",
  "Identity and Access Management",
  "Financial Reporting",
  "Data Cleaning",
  "Visualisation Basics",
  "Risk Management",
  "Routing and Switching",
  "Server Administration",
];

const DRAFT_KEY = "dzidzaai:onboarding:draft";
const DRAFT_META_KEY = "dzidzaai:onboarding:draftMeta";

type OnboardingState = {
  educationLevel: User["educationLevel"];
  schoolName: string;
  country: string;
  curriculum: string;
  currentGradeFormYear: string;
  institutionName: string;
  facultySchool: string;
  degreeProgram: string;
  major: string;
  specialization: string;
  yearOfStudy: string;
  semester: string;
  certificationName: string;
  certificationProvider: string;
  examLevel: string;
  curriculumSystem: string;
  curriculumBoard: string;
  selectedItems: string[];
  academicInterests: string[];
  academicGoals: string[];
  preferredDifficulty: "beginner" | "intermediate" | "advanced";
  tutoringStyle: "guided" | "exam_focused" | "visual" | "practice_first";
  responseDepth: "concise" | "balanced" | "detailed";
  notes: string;
};

const getSuggestions = (level: OnboardingState["educationLevel"]) => {
  if (
    ["Primary School", "Secondary School", "O-Level", "A-Level"].includes(level)
  ) {
    return SCHOOL_SUGGESTIONS;
  }
  if (["College", "University"].includes(level)) {
    return TERTIARY_SUGGESTIONS;
  }
  if (level === "Professional Certification") {
    return CERTIFICATION_SUGGESTIONS;
  }
  return [...SCHOOL_SUGGESTIONS, ...TERTIARY_SUGGESTIONS].slice(0, 24);
};

const cloneArray = (value?: string[]) => [
  ...new Set((value || []).map((item) => item.trim()).filter(Boolean)),
];

const buildInitialState = (user: User | null): OnboardingState => {
  const academic = user?.academicProfile;
  return {
    educationLevel: user?.educationLevel || academic?.track || "O-Level",
    schoolName: academic?.school?.name || "",
    country: academic?.school?.country || academic?.institution?.country || "",
    curriculum:
      academic?.school?.curriculum ||
      academic?.curriculumMetadata?.system ||
      "",
    currentGradeFormYear: academic?.school?.currentGradeFormYear || "",
    institutionName: academic?.institution?.name || "",
    facultySchool: academic?.institution?.facultySchool || "",
    degreeProgram: academic?.program?.degreeProgram || "",
    major: academic?.program?.major || "",
    specialization: academic?.program?.specialization || "",
    yearOfStudy: academic?.program?.yearOfStudy || "",
    semester: academic?.program?.semester || "",
    certificationName: academic?.certification?.name || "",
    certificationProvider: academic?.certification?.provider || "",
    examLevel: academic?.certification?.examLevel || "",
    curriculumSystem: academic?.curriculumMetadata?.system || "",
    curriculumBoard: academic?.curriculumMetadata?.board || "",
    selectedItems: cloneArray(user?.subjects?.map((subject) => subject.name)),
    academicInterests: cloneArray(academic?.academicInterests),
    academicGoals: cloneArray(academic?.academicGoals),
    preferredDifficulty: academic?.preferences?.difficulty || "intermediate",
    tutoringStyle: academic?.preferences?.tutoringStyle || "guided",
    responseDepth: academic?.preferences?.responseDepth || "balanced",
    notes: academic?.notes || "",
  };
};

const getTrackKind = (level: OnboardingState["educationLevel"]) => {
  if (
    ["Primary School", "Secondary School", "O-Level", "A-Level"].includes(level)
  ) {
    return "school";
  }
  if (["College", "University"].includes(level)) {
    return "tertiary";
  }
  if (level === "Professional Certification") return "certification";
  return "general";
};

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [entry, setEntry] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<OnboardingState>(() =>
    buildInitialState(user),
  );
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const draft = window.localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as Partial<OnboardingState>;
        setForm((current) => ({ ...current, ...parsed }));
      } catch {}
    }

    try {
      const meta = window.localStorage.getItem(DRAFT_META_KEY);
      if (meta) {
        const parsed = JSON.parse(meta) as {
          draftId?: string;
          completed?: boolean;
        };
        if (parsed?.draftId && !parsed.completed) {
          // attempt to restore server draft into form (best-effort)
          onboardingApi
            .getDraft(parsed.draftId)
            .then((res) => {
              const draftData = res.data?.data?.draft?.data;
              if (draftData)
                setForm((current) => ({ ...current, ...draftData }));
              setSaveState("saved");
            })
            .catch(() => {
              setSaveState("error");
            });
        }
      }
    } catch (e) {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    saveTimer.current = window.setTimeout(() => {
      setSaving(true);
      setSaveState("saving");
      const payload: Record<string, unknown> = {
        ...form,
        subjects: [
          "Primary School",
          "Secondary School",
          "O-Level",
          "A-Level",
        ].includes(form.educationLevel)
          ? form.selectedItems
          : [],
        courseModules: [
          "College",
          "University",
          "Professional Certification",
        ].includes(form.educationLevel)
          ? form.selectedItems
          : [],
        academicInterests: form.academicInterests,
        academicGoals: form.academicGoals,
        completed: false,
      };

      const isAuthenticated = !!user;
      if (isAuthenticated) {
        userApi
          .saveAcademicProfile(payload)
          .then((res) => {
            const updatedUser = (res.data as any).data?.user;
            if (updatedUser) setUser(updatedUser);
            setSaveState("saved");
          })
          .catch(() => {
            setSaveState("error");
          })
          .finally(() => setSaving(false));
      } else {
        // anonymous draft save: create or update server draft and persist id/meta
        (async () => {
          try {
            const metaRaw = window.localStorage.getItem(DRAFT_META_KEY);
            const meta = metaRaw ? JSON.parse(metaRaw) : {};
            if (meta?.draftId) {
              await onboardingApi.updateDraft(meta.draftId, payload);
              setSaveState("saved");
            } else {
              const res = await onboardingApi.createDraft(payload);
              const draftId = (res.data as any)?.data?.draftId;
              if (draftId) {
                window.localStorage.setItem(
                  DRAFT_META_KEY,
                  JSON.stringify({ draftId }),
                );
                setSaveState("saved");
              }
            }
          } catch (e) {
            setSaveState("error");
            // ignore save errors silently
          } finally {
            setSaving(false);
          }
        })();
      }
    }, 900);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [form, hydrated, setUser]);

  const trackKind = useMemo(
    () => getTrackKind(form.educationLevel),
    [form.educationLevel],
  );
  const suggestions = useMemo(
    () =>
      getSuggestions(form.educationLevel).filter((item) =>
        item.toLowerCase().includes(search.toLowerCase()),
      ),
    [form.educationLevel, search],
  );

  const progress = Math.min(100, (step / 3) * 100);

  const addItem = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    setForm((current) => {
      if (
        current.selectedItems.some(
          (item) => item.toLowerCase() === cleaned.toLowerCase(),
        )
      ) {
        return current;
      }
      return { ...current, selectedItems: [...current.selectedItems, cleaned] };
    });
    setEntry("");
  };

  const removeItem = (value: string) => {
    setForm((current) => ({
      ...current,
      selectedItems: current.selectedItems.filter((item) => item !== value),
    }));
  };

  const addListItem = (
    field: "academicInterests" | "academicGoals",
    value: string,
  ) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    setForm((current) => {
      const existing = current[field];
      if (existing.some((item) => item.toLowerCase() === cleaned.toLowerCase()))
        return current;
      return { ...current, [field]: [...existing, cleaned] } as OnboardingState;
    });
    setEntry("");
  };

  const removeListItem = (
    field: "academicInterests" | "academicGoals",
    value: string,
  ) => {
    setForm(
      (current) =>
        ({
          ...current,
          [field]: current[field].filter((item) => item !== value),
        }) as OnboardingState,
    );
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const level = form.educationLevel;
    if (!level) next.educationLevel = "Select your education level";

    if (trackKind === "school") {
      if (!form.schoolName.trim()) next.schoolName = "School name is required";
      if (!form.country.trim()) next.country = "Country is required";
      if (!form.curriculum.trim())
        next.curriculum = "Curriculum/system is required";
      if (!form.currentGradeFormYear.trim())
        next.currentGradeFormYear = "Grade/form/year is required";
      if (!form.selectedItems.length)
        next.selectedItems = "Select at least one subject";
    }

    if (trackKind === "tertiary") {
      if (!form.institutionName.trim())
        next.institutionName = "Institution name is required";
      if (!form.country.trim()) next.country = "Country is required";
      if (!form.facultySchool.trim())
        next.facultySchool = "Faculty/school is required";
      if (!form.degreeProgram.trim())
        next.degreeProgram = "Degree program is required";
      if (!form.yearOfStudy.trim())
        next.yearOfStudy = "Year of study is required";
      if (!form.semester.trim()) next.semester = "Semester is required";
      if (!form.selectedItems.length)
        next.selectedItems = "Add at least one course/module";
    }

    if (trackKind === "certification") {
      if (!form.certificationName.trim())
        next.certificationName = "Certification name is required";
      if (!form.certificationProvider.trim())
        next.certificationProvider = "Provider is required";
      if (!form.examLevel.trim()) next.examLevel = "Exam level is required";
      if (!form.selectedItems.length)
        next.selectedItems = "Add at least one module/topic";
    }

    if (!form.academicInterests.length && !form.academicGoals.length) {
      next.academicInterests = "Add an academic interest or goal";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        subjects: [
          "Primary School",
          "Secondary School",
          "O-Level",
          "A-Level",
        ].includes(form.educationLevel)
          ? form.selectedItems
          : [],
        courseModules: [
          "College",
          "University",
          "Professional Certification",
        ].includes(form.educationLevel)
          ? form.selectedItems
          : [],
        academicInterests: form.academicInterests,
        academicGoals: form.academicGoals,
        completed: true,
      };
      const isAuthenticated = !!user;
      if (isAuthenticated) {
        const res = await userApi.saveAcademicProfile(payload);
        const updatedUser = (res.data as any).data?.user;
        if (updatedUser) setUser(updatedUser);
        window.localStorage.removeItem(DRAFT_KEY);
        window.localStorage.removeItem(DRAFT_META_KEY);
        toast.success("Onboarding completed");
        navigate({ to: "/dashboard" });
      } else {
        // anonymous: finalize draft then send user to signup
        try {
          const metaRaw = window.localStorage.getItem(DRAFT_META_KEY);
          const meta = metaRaw ? JSON.parse(metaRaw) : {};
          if (meta?.draftId) {
            await onboardingApi.updateDraft(meta.draftId, payload);
            window.localStorage.setItem(
              DRAFT_META_KEY,
              JSON.stringify({ draftId: meta.draftId, completed: true }),
            );
            toast.success("Onboarding saved. Continue to sign up.");
            navigate({ to: "/signup", search: { draftId: meta.draftId } });
          } else {
            const res = await onboardingApi.createDraft(payload);
            const draftId = (res.data as any)?.data?.draftId;
            if (draftId) {
              window.localStorage.setItem(
                DRAFT_META_KEY,
                JSON.stringify({ draftId, completed: true }),
              );
              toast.success("Onboarding saved. Continue to sign up.");
              navigate({ to: "/signup", search: { draftId } });
            } else {
              throw new Error("Unable to create draft");
            }
          }
        } catch (e) {
          toast.error("Unable to finalize onboarding. Try again.");
        }
      }
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors;
      if (Array.isArray(validationErrors)) {
        const mapped: Record<string, string> = {};
        validationErrors.forEach((item: any) => {
          if (item.field) mapped[item.field] = item.message;
        });
        setErrors(mapped);
      }
      toast.error(err.response?.data?.message || "Unable to save onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabel =
    step === 1
      ? "Academic identity"
      : step === 2
        ? "Subjects / modules"
        : "Goals & preferences";

  const sourceLabel =
    trackKind === "school"
      ? "subject"
      : trackKind === "certification"
        ? "module/topic"
        : "course/module";

  if (!hydrated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner size={40} className="text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in space-y-6">
      <SectionHeader
        title="Complete your academic profile"
        subtitle="Tell DzidzaAI what you study so tutoring, quizzes, and plans feel built for your curriculum."
        icon={<GraduationCap size={20} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2">
                Step {step} of 3
              </p>
              <h3 className="text-2xl font-bold font-serif text-ink">
                {stepLabel}
              </h3>
            </div>
            <Badge variant="blue" className="gap-1.5">
              <Sparkles size={12} /> Autosaving
            </Badge>
          </div>
          <ProgressBar value={progress} className="mb-6" />

          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 1, label: "Identity" },
              {
                id: 2,
                label: sourceLabel === "subject" ? "Subjects" : "Modules",
              },
              { id: 3, label: "Preferences" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setStep(item.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                  step === item.id
                    ? "bg-primary text-white border-primary shadow-lg"
                    : "bg-surface2 text-ink3 border-border2"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2 block">
                  Education level
                </label>
                <select
                  className="input text-sm font-bold bg-bg"
                  value={form.educationLevel}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      educationLevel: e.target.value as User["educationLevel"],
                    }))
                  }
                >
                  {LEVEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.educationLevel && (
                  <p className="mt-2 text-xs font-bold text-red-500">
                    {errors.educationLevel}
                  </p>
                )}
              </div>

              {trackKind === "school" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="School name"
                    placeholder="e.g. St. John's College"
                    value={form.schoolName}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        schoolName: e.target.value,
                      }))
                    }
                    error={errors.schoolName}
                  />
                  <Input
                    label="Country"
                    placeholder="e.g. Zimbabwe"
                    value={form.country}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        country: e.target.value,
                      }))
                    }
                    error={errors.country}
                  />
                  <Input
                    label="Curriculum / system"
                    placeholder="e.g. ZIMSEC, Cambridge, CAPS"
                    value={form.curriculum}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        curriculum: e.target.value,
                      }))
                    }
                    error={errors.curriculum}
                  />
                  <Input
                    label="Current grade / form / year"
                    placeholder="e.g. Form 4, Grade 7, Year 12"
                    value={form.currentGradeFormYear}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        currentGradeFormYear: e.target.value,
                      }))
                    }
                    error={errors.currentGradeFormYear}
                  />
                </div>
              )}

              {trackKind === "tertiary" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Institution name"
                    placeholder="University / college name"
                    value={form.institutionName}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        institutionName: e.target.value,
                      }))
                    }
                    error={errors.institutionName}
                  />
                  <Input
                    label="Country"
                    placeholder="Institution country"
                    value={form.country}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        country: e.target.value,
                      }))
                    }
                    error={errors.country}
                  />
                  <Input
                    label="Faculty / school"
                    placeholder="e.g. Faculty of Engineering"
                    value={form.facultySchool}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        facultySchool: e.target.value,
                      }))
                    }
                    error={errors.facultySchool}
                  />
                  <Input
                    label="Degree program"
                    placeholder="e.g. BSc Computer Science"
                    value={form.degreeProgram}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        degreeProgram: e.target.value,
                      }))
                    }
                    error={errors.degreeProgram}
                  />
                  <Input
                    label="Major / specialization"
                    placeholder="Major or track"
                    value={form.major}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        major: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Year of study"
                    placeholder="e.g. Year 2"
                    value={form.yearOfStudy}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        yearOfStudy: e.target.value,
                      }))
                    }
                    error={errors.yearOfStudy}
                  />
                  <Input
                    label="Specialization / stream"
                    placeholder="Optional specialization"
                    value={form.specialization}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        specialization: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Semester"
                    placeholder="e.g. Semester 1"
                    value={form.semester}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        semester: e.target.value,
                      }))
                    }
                    error={errors.semester}
                  />
                </div>
              )}

              {trackKind === "certification" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Certification name"
                    placeholder="e.g. AWS Cloud Practitioner"
                    value={form.certificationName}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        certificationName: e.target.value,
                      }))
                    }
                    error={errors.certificationName}
                  />
                  <Input
                    label="Provider"
                    placeholder="e.g. Amazon, Cisco, ACCA"
                    value={form.certificationProvider}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        certificationProvider: e.target.value,
                      }))
                    }
                    error={errors.certificationProvider}
                  />
                  <Input
                    label="Exam level"
                    placeholder="e.g. Foundation, Associate, Professional"
                    value={form.examLevel}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        examLevel: e.target.value,
                      }))
                    }
                    error={errors.examLevel}
                  />
                  <Input
                    label="Country / region"
                    placeholder="Optional"
                    value={form.country}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        country: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2 block">
                  Add {sourceLabel}s
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Search or add a ${sourceLabel}`}
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addItem(entry)}
                    icon={<Search size={16} />}
                  />
                  <Button onClick={() => addItem(entry)} className="gap-2">
                    <Plus size={16} /> Add
                  </Button>
                </div>
                {errors.selectedItems && (
                  <p className="mt-2 text-xs font-bold text-red-500">
                    {errors.selectedItems}
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-border2 bg-surface2 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3">
                    Suggested {sourceLabel}s
                  </p>
                  <Input
                    placeholder="Filter suggestions"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 18).map((item) => (
                    <button
                      key={item}
                      onClick={() => addItem(item)}
                      className="px-3 py-2 rounded-full text-xs font-bold border border-border2 bg-surface hover:border-primary/30 hover:text-primary transition-all"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-3">
                  Selected items
                </p>
                <div className="flex flex-wrap gap-2 min-h-14">
                  {form.selectedItems.map((item) => (
                    <Badge key={item} variant="blue" className="gap-2">
                      {item}
                      <button
                        onClick={() => removeItem(item)}
                        aria-label={`Remove ${item}`}
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                  {!form.selectedItems.length && (
                    <p className="text-sm text-ink3">
                      Add at least one {sourceLabel} to personalize quizzes and
                      tutoring.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2 block">
                    Academic interests
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an interest"
                      value={entry}
                      onChange={(e) => setEntry(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        addListItem("academicInterests", entry)
                      }
                    />
                    <Button
                      onClick={() => addListItem("academicInterests", entry)}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  {errors.academicInterests && (
                    <p className="mt-2 text-xs font-bold text-red-500">
                      {errors.academicInterests}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.academicInterests.map((item) => (
                      <Badge key={item} variant="teal" className="gap-2">
                        {item}
                        <button
                          onClick={() =>
                            removeListItem("academicInterests", item)
                          }
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2 block">
                    Academic goals
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a goal"
                      value={entry}
                      onChange={(e) => setEntry(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && addListItem("academicGoals", entry)
                      }
                    />
                    <Button
                      onClick={() => addListItem("academicGoals", entry)}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.academicGoals.map((item) => (
                      <Badge key={item} variant="purple" className="gap-2">
                        {item}
                        <button
                          onClick={() => removeListItem("academicGoals", item)}
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2 block">
                    Difficulty
                  </label>
                  <select
                    className="input text-sm font-bold bg-bg"
                    value={form.preferredDifficulty}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        preferredDifficulty: e.target
                          .value as OnboardingState["preferredDifficulty"],
                      }))
                    }
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2 block">
                    Tutoring style
                  </label>
                  <select
                    className="input text-sm font-bold bg-bg"
                    value={form.tutoringStyle}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        tutoringStyle: e.target
                          .value as OnboardingState["tutoringStyle"],
                      }))
                    }
                  >
                    <option value="guided">Guided</option>
                    <option value="exam_focused">Exam focused</option>
                    <option value="visual">Visual</option>
                    <option value="practice_first">Practice first</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2 block">
                    Response depth
                  </label>
                  <select
                    className="input text-sm font-bold bg-bg"
                    value={form.responseDepth}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        responseDepth: e.target
                          .value as OnboardingState["responseDepth"],
                      }))
                    }
                  >
                    <option value="concise">Concise</option>
                    <option value="balanced">Balanced</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2 block">
                  Notes for DzidzaAI
                </label>
                <textarea
                  className="input min-h-28 resize-none"
                  placeholder="Anything else DzidzaAI should know about your learning context or goals"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={step === 1}
            >
              Back
            </Button>
            <div className="flex gap-3">
              {step < 3 ? (
                <Button
                  onClick={() => {
                    if (step === 1 && !validate()) return;
                    setStep((current) => Math.min(3, current + 1));
                  }}
                  className="gap-2"
                >
                  Continue <ChevronRight size={16} />
                </Button>
              ) : (
                <Button onClick={submit} loading={submitting} className="gap-2">
                  Finish setup <CheckCircle2 size={16} />
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-8 bg-linear-to-br from-surface via-surface to-primary/5 border-primary/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold font-serif text-ink">
              Personalization preview
            </h3>
            {saveState === "saving" ? (
              <Badge variant="blue" className="gap-2">
                <Spinner size={14} className="text-primary" /> Saving...
              </Badge>
            ) : saveState === "error" ? (
              <Badge variant="red">Connection lost</Badge>
            ) : saveState === "saved" ? (
              <Badge variant="green">Saved</Badge>
            ) : (
              <Badge variant="green">Synced</Badge>
            )}
          </div>
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-border2 bg-surface2 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2">
                Education track
              </p>
              <p className="font-semibold text-ink">{form.educationLevel}</p>
            </div>
            <div className="rounded-2xl border border-border2 bg-surface2 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2">
                Selected items
              </p>
              <p className="font-semibold text-ink">
                {form.selectedItems.length
                  ? form.selectedItems.join(", ")
                  : "None yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-border2 bg-surface2 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2">
                Why this matters
              </p>
              <p className="font-medium text-ink2 leading-relaxed">
                DzidzaAI will use this profile to tailor explanations, generate
                curriculum-aware quizzes, build targeted flashcards, and
                prioritize your weakest topics.
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-border2 bg-surface p-5">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <Sparkles size={16} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                Smart behavior enabled
              </p>
            </div>
            <ul className="space-y-2 text-sm text-ink2">
              <li>• Education-level-aware tutoring and explanations</li>
              <li>• Subject- or course-aware quizzes and exam papers</li>
              <li>• Personalized learning paths and revision schedules</li>
              <li>• Analytics grouped by your academic track</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {
  academicProfileSchema,
  subjectSelectionSchema,
} = require("./schemas/academicProfile");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    educationLevel: {
      type: String,
      enum: [
        "Primary School",
        "Secondary School",
        "ZJC",
        "O-Level",
        "A-Level",
        "College",
        "University",
        "Professional Certification",
        "Other",
      ],
      default: "Other",
    },
    onboardingCompleted: { type: Boolean, default: false },
    academicProfile: {
      type: academicProfileSchema,
      default: () => ({}),
    },
    preferredLanguage: {
      type: String,
      enum: ["english", "shona", "ndebele"],
      default: "english",
    },
    subjects: [subjectSelectionSchema],
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastStudyDate: Date,
    },
    badges: [{ name: String, earnedAt: Date, icon: String }],
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    profilePicture: String,
    timezone: { type: String, default: "Africa/Harare" },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate XP level
userSchema.methods.updateLevel = function () {
  this.level = Math.floor(Math.sqrt(this.xp / 100)) + 1;
};

// Update streak
userSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastStudy = this.streak.lastStudyDate
    ? new Date(this.streak.lastStudyDate)
    : null;
  if (lastStudy) {
    lastStudy.setHours(0, 0, 0, 0);
    const diff = (today - lastStudy) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      this.streak.current += 1;
    } else if (diff > 1) {
      this.streak.current = 1;
    }
  } else {
    this.streak.current = 1;
  }
  if (this.streak.current > this.streak.longest) {
    this.streak.longest = this.streak.current;
  }
  this.streak.lastStudyDate = new Date();
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);

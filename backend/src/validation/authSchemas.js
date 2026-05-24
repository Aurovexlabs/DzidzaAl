const { z } = require("zod");

const email = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());
const password = z
  .string()
  .min(8)
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
  educationLevel: z.enum([
    "Primary School",
    "Secondary School",
    "ZJC",
    "O-Level",
    "A-Level",
    "College",
    "University",
    "Professional Certification",
    "Other",
  ]),
  draftId: z.string().trim().min(1).optional(),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

const otpSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/),
});

const resendOtpSchema = z.object({
  email,
  type: z.enum(["email_verification", "password_reset"]).optional(),
});

const forgotPasswordSchema = z.object({
  email,
});

const resetPasswordSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/),
  newPassword: password,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

module.exports = {
  signupSchema,
  loginSchema,
  otpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};

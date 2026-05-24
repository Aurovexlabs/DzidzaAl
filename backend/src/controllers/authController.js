const User = require("../models/User");
const OTP = require("../models/OTP");
const RefreshToken = require("../models/RefreshToken");
const {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
} = require("../services/emailService");
const {
  generateTokenPair,
  verifyRefreshToken,
  hashToken,
  generateJti,
  generateCsrfToken,
} = require("../services/tokenService");
const { setAuthCookies, clearAuthCookies } = require("../utils/authCookies");

const OTP_EXPIRY_MINUTES = 10;

const buildSafeUser = (user) => {
  const plain = user.toObject ? user.toObject() : user;
  delete plain.password;
  return plain;
};

const persistRefreshToken = async ({ userId, refreshToken, jti, req }) => {
  await RefreshToken.create({
    user: userId,
    jti,
    tokenHash: hashToken(refreshToken),
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
};

const revokeRefreshTokenByJti = async (userId, jti, replacedByJti) => {
  if (!jti) return;
  await RefreshToken.updateOne(
    { user: userId, jti, revokedAt: { $exists: false } },
    {
      $set: {
        revokedAt: new Date(),
        ...(replacedByJti ? { replacedByJti } : {}),
      },
    },
  );
};

const revokeAllRefreshTokens = async (userId) => {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: { $exists: false } },
    { revokedAt: new Date() },
  );
};

// POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password, educationLevel } = req.body;

    const existing = await User.findOne({ email });
    if (existing && existing.isEmailVerified) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }
    if (existing && !existing.isEmailVerified) {
      await User.deleteOne({ email });
    }

    const user = await User.create({
      name,
      email,
      password,
      educationLevel: educationLevel || "O-Level",
    });

    // If an onboarding draft was provided, attach it to the new user
    try {
      const { draftId } = req.body || {};
      if (draftId) {
        const OnboardingDraft = require("../models/OnboardingDraft");
        const draft = await OnboardingDraft.findById(draftId);
        if (draft) {
          user.academicProfile = draft.data || {};
          user.onboardingCompleted = Boolean(draft.completed);
          if (draft.data && draft.data.educationLevel) {
            user.educationLevel = draft.data.educationLevel;
          }
          // subjects/courseModules -> subjects array
          const subjects = Array.isArray(draft.data?.subjects)
            ? draft.data.subjects
            : Array.isArray(draft.data?.courseModules)
              ? draft.data.courseModules
              : [];
          if (subjects.length) {
            user.subjects = subjects.map((s) => ({ name: String(s) }));
          }
          draft.user = user._id;
          draft.completed = true;
          await draft.save();
          await user.save();
        }
      }
    } catch (e) {
      // continue even if attaching draft fails
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await OTP.findOneAndDelete({ email, type: "email_verification" });
    await OTP.create({ email, otp, type: "email_verification", expiresAt });

    await sendOTPEmail(email, otp, "email_verification");

    res.status(201).json({
      success: true,
      message:
        "Account created. Please check your email for the verification code.",
      data: { email, name },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email, type: "email_verification" });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired. Request a new one.",
      });
    }
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res
        .status(400)
        .json({ success: false, message: "OTP expired. Request a new one." });
    }
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Request a new OTP.",
      });
    }
    if (otpRecord.otp !== otp) {
      await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true },
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    await OTP.deleteOne({ _id: otpRecord._id });

    const refreshJti = generateJti();
    const { accessToken, refreshToken, refreshExpiresAt } = generateTokenPair(
      user._id,
      refreshJti,
    );
    user.lastLogin = new Date();
    await user.save();
    await persistRefreshToken({
      userId: user._id,
      refreshToken,
      jti: refreshJti,
      req,
    });

    const csrfToken = generateCsrfToken();
    setAuthCookies(res, refreshToken, csrfToken);

    await sendWelcomeEmail(email, user.name);

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        user: buildSafeUser(user),
        accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-otp
const resendOTP = async (req, res, next) => {
  try {
    const { email, type = "email_verification" } = req.body;
    await OTP.findOneAndDelete({ email, type });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await OTP.create({ email, otp, type, expiresAt });
    await sendOTPEmail(email, otp, type);

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
        code: "EMAIL_UNVERIFIED",
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account deactivated. Contact support.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const refreshJti = generateJti();
    const { accessToken, refreshToken, refreshExpiresAt } = generateTokenPair(
      user._id,
      refreshJti,
    );
    user.lastLogin = new Date();
    user.updateStreak();
    await user.save();
    await persistRefreshToken({
      userId: user._id,
      refreshToken,
      jti: refreshJti,
      req,
    });

    const csrfToken = generateCsrfToken();
    setAuthCookies(res, refreshToken, csrfToken);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: buildSafeUser(user),
        accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Refresh token required" });

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "User not found" });

    const tokenRecord = await RefreshToken.findOne({
      user: user._id,
      jti: decoded.jti,
    });
    if (!tokenRecord || tokenRecord.revokedAt) {
      await revokeAllRefreshTokens(user._id);
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    if (tokenRecord.tokenHash !== hashToken(token)) {
      await revokeAllRefreshTokens(user._id);
      return res
        .status(401)
        .json({ success: false, message: "Refresh token mismatch" });
    }

    const nextRefreshJti = generateJti();
    await revokeRefreshTokenByJti(user._id, decoded.jti, nextRefreshJti);
    const {
      accessToken,
      refreshToken: newRefresh,
      refreshExpiresAt,
    } = generateTokenPair(user._id, nextRefreshJti);
    await persistRefreshToken({
      userId: user._id,
      refreshToken: newRefresh,
      jti: nextRefreshJti,
      req,
    });
    const csrfToken = generateCsrfToken();
    setAuthCookies(res, newRefresh, csrfToken);

    res.json({
      success: true,
      data: {
        user: buildSafeUser(user),
        accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
      },
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await revokeRefreshTokenByJti(req.user._id, decoded.jti);
      } catch (_) {}
    }
    clearAuthCookies(res);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always respond the same to prevent email enumeration
    if (!user || !user.isEmailVerified) {
      return res.json({
        success: true,
        message: "If that email exists, a reset code has been sent.",
      });
    }

    await OTP.findOneAndDelete({ email, type: "password_reset" });
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await OTP.create({ email, otp, type: "password_reset", expiresAt });
    await sendOTPEmail(email, otp, "password_reset");

    res.json({
      success: true,
      message: "If that email exists, a reset code has been sent.",
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email, type: "password_reset" });
    if (
      !otpRecord ||
      new Date() > otpRecord.expiresAt ||
      otpRecord.otp !== otp
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset code." });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.password = newPassword;
    await RefreshToken.updateMany(
      { user: user._id },
      { revokedAt: new Date() },
    );
    await user.save();
    await OTP.deleteOne({ _id: otpRecord._id });
    await sendPasswordChangedEmail(email, user.name);

    res.json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/change-password  (authenticated)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });

    user.password = newPassword;
    await RefreshToken.updateMany(
      { user: user._id },
      { revokedAt: new Date() },
    );
    await user.save();
    await sendPasswordChangedEmail(user.email, user.name);

    res.json({
      success: true,
      message: "Password changed. Please log in again.",
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

module.exports = {
  signup,
  verifyEmail,
  resendOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
};

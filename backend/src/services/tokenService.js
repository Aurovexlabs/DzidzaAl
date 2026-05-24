const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
const generateJti = () => crypto.randomUUID();
const generateCsrfToken = () => crypto.randomBytes(32).toString("hex");

const parseDurationToMs = (duration, fallbackMs) => {
  if (typeof duration !== "string" || !duration.trim()) return fallbackMs;

  const match = duration.trim().match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackMs;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || fallbackMs);
};

const getRefreshTokenMaxAgeMs = () =>
  parseDurationToMs(process.env.JWT_REFRESH_EXPIRES, 7 * 24 * 60 * 60 * 1000);

const getTokenExpiryDate = (token, fallbackMs) => {
  const decoded = jwt.decode(token);
  if (decoded && typeof decoded === "object" && decoded.exp) {
    return new Date(decoded.exp * 1000);
  }
  return new Date(Date.now() + fallbackMs);
};

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId, jti: generateJti() },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
    },
  );
};

const generateRefreshToken = (userId, jti = generateJti()) => {
  return jwt.sign({ userId, jti }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const generateTokenPair = (userId, refreshJti) => {
  const refreshToken = generateRefreshToken(userId, refreshJti);
  const refreshMaxAgeMs = getRefreshTokenMaxAgeMs();
  return {
    accessToken: generateAccessToken(userId),
    refreshToken,
    refreshJti: refreshJti || jwt.decode(refreshToken)?.jti,
    refreshExpiresAt: getTokenExpiryDate(refreshToken, refreshMaxAgeMs),
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenPair,
  hashToken,
  generateJti,
  generateCsrfToken,
  getRefreshTokenMaxAgeMs,
};

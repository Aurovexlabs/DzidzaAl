const { env } = require("../config/env");
const { getRefreshTokenMaxAgeMs } = require("../services/tokenService");

const cookieBase = () => ({
  path: "/",
  domain: env.COOKIE_DOMAIN || undefined,
  secure: env.COOKIE_SECURE
    ? env.COOKIE_SECURE === "true"
    : env.NODE_ENV === "production",
  sameSite: env.COOKIE_SAME_SITE,
});

const clearCookieBase = () => ({
  path: "/",
  domain: env.COOKIE_DOMAIN || undefined,
  secure: env.COOKIE_SECURE
    ? env.COOKIE_SECURE === "true"
    : env.NODE_ENV === "production",
  sameSite: env.COOKIE_SAME_SITE,
});

const setAuthCookies = (res, refreshToken, csrfToken) => {
  res.cookie("refresh_token", refreshToken, {
    ...cookieBase(),
    httpOnly: true,
    maxAge: getRefreshTokenMaxAgeMs(),
  });

  res.cookie("XSRF-TOKEN", csrfToken, {
    ...cookieBase(),
    httpOnly: false,
    maxAge: getRefreshTokenMaxAgeMs(),
  });
};

const clearAuthCookies = (res) => {
  const common = clearCookieBase();
  res.clearCookie("refresh_token", common);
  res.clearCookie("XSRF-TOKEN", common);
};

module.exports = { setAuthCookies, clearAuthCookies };

const crypto = require("crypto");

const safeString = (value) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const sanitizeObject = (input) => {
  if (Array.isArray(input)) return input.map(sanitizeObject);
  if (!input || typeof input !== "object") return safeString(input);

  return Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => !key.startsWith("$") && !key.includes("."))
      .map(([key, value]) => [key, sanitizeObject(value)]),
  );
};

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object")
    req.body = sanitizeObject(req.body);
  if (req.query && typeof req.query === "object")
    req.query = sanitizeObject(req.query);
  if (req.params && typeof req.params === "object")
    req.params = sanitizeObject(req.params);
  next();
};

const issueCsrfToken = () => crypto.randomBytes(32).toString("hex");

const csrfProtection = (req, res, next) => {
  const unsafeMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (!unsafeMethod) return next();

  const hasAuth =
    Boolean(req.headers.authorization) || Boolean(req.cookies?.refresh_token);
  if (!hasAuth) return next();

  if (req.path === "/auth/login" || req.path === "/auth/signup") return next();

  const cookieToken = req.cookies?.["XSRF-TOKEN"];
  const headerToken = req.headers["x-csrf-token"];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res
      .status(403)
      .json({ success: false, message: "CSRF validation failed" });
  }

  next();
};

module.exports = { sanitizeRequest, csrfProtection, issueCsrfToken };

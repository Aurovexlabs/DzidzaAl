require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");

const { env } = require("./config/env");
const connectDB = require("./config/database");
const routes = require("./routes/index");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimiter");
const {
  sanitizeRequest,
  csrfProtection,
} = require("./middleware/requestSecurity");
const { requestId, requestMetrics } = require("./middleware/observability");
const { metricsRegistry } = require("./utils/metrics");
const notificationService = require("./services/notificationService");
const { startCronJobs } = require("./utils/cronJobs");
const { startDocumentWorker } = require("./workers/documentWorker");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1);

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

notificationService.setIO(io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select("_id name");
    if (!user) return next(new Error("User not found"));
    socket.userId = user._id.toString();
    socket.userName = user.name;
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);
  console.log(`[Socket.IO] ${socket.userName} connected`);

  socket.on("join_group", (groupId) => {
    socket.join(`group:${groupId}`);
  });

  socket.on("leave_group", (groupId) => {
    socket.leave(`group:${groupId}`);
  });

  socket.on("group_message", ({ groupId, message }) => {
    io.to(`group:${groupId}`).emit("group_message", {
      senderId: socket.userId,
      senderName: socket.userName,
      message,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] ${socket.userName} disconnected`);
  });
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(requestId);
app.use(requestMetrics);
app.use(sanitizeRequest);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        imgSrc: ["'self'", "data:", env.CLIENT_URL],
        connectSrc: ["'self'", env.CLIENT_URL],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null,
      },
    },
    hsts: env.NODE_ENV === "production",
    referrerPolicy: { policy: "no-referrer" },
  }),
);
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(generalLimiter);
app.use(csrfProtection);

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "DzidzaAI API is running",
    version: "2.0.0",
    timestamp: new Date(),
    environment: env.NODE_ENV,
    database: "connected",
  });
});

app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = env.PORT;

const startServer = async () => {
  await connectDB();
  startDocumentWorker();
  startCronJobs();
  server.listen(PORT, () => {
    console.log(`\n🚀 DzidzaAI API running on port ${PORT}`);
    console.log(`📡 Environment: ${env.NODE_ENV}`);
    console.log(`🗄  MongoDB: connected`);
    console.log(`⚡ Socket.IO: ready`);
    console.log(`🌐 API: http://localhost:${PORT}/api\n`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

module.exports = { app, io };

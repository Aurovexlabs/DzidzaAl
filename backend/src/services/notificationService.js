const Notification = require("../models/Notification");

let io;

const setIO = (socketIO) => {
  io = socketIO;
};

const createNotification = async ({
  userId,
  type,
  title,
  message,
  priority = "medium",
  data = {},
  scheduledFor = null,
}) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    priority,
    data,
    scheduledFor,
    sentAt: scheduledFor ? null : new Date(),
  });

  if (!scheduledFor && io) {
    io.to(`user:${userId}`).emit("notification", {
      id: notification._id,
      type,
      title,
      message,
      priority,
      createdAt: notification.createdAt,
    });
  }

  return notification;
};

const sendStudyReminder = async (userId, subject, time) => {
  return createNotification({
    userId,
    type: "study_reminder",
    title: `Time to study ${subject}`,
    message: `Your ${subject} session starts at ${time}. Keep that streak going!`,
    priority: "medium",
    data: { subject, time },
  });
};

const sendPerformanceAlert = async (userId, subject, score, trend) => {
  const isImprovement = trend === "up";
  return createNotification({
    userId,
    type: isImprovement ? "improvement" : "performance_alert",
    title: isImprovement
      ? `Great progress in ${subject}!`
      : `${subject} needs attention`,
    message: isImprovement
      ? `Your ${subject} score improved to ${score}%. Keep it up!`
      : `Your ${subject} score dropped to ${score}%. DzidzaAI has added extra sessions to your schedule.`,
    priority: isImprovement ? "low" : "high",
    data: { subject, score, trend },
  });
};

const sendSpacedRepetitionAlert = async (userId, topics) => {
  return createNotification({
    userId,
    type: "spaced_repetition",
    title: "Review time!",
    message: `It's time to review: ${topics.join(", ")}. Spaced repetition boosts long-term retention.`,
    priority: "medium",
    data: { topics },
  });
};

const sendStreakAlert = async (userId, streak) => {
  return createNotification({
    userId,
    type: "streak",
    title: `${streak}-day streak! 🔥`,
    message: `You've studied ${streak} days in a row. You're building real momentum!`,
    priority: "low",
    data: { streak },
  });
};

const sendBadgeEarned = async (userId, badge) => {
  return createNotification({
    userId,
    type: "badge_earned",
    title: `Badge earned: ${badge.name}`,
    message: `You unlocked the "${badge.name}" badge. ${badge.description || ""}`,
    priority: "low",
    data: { badge },
  });
};

const sendPartnerMatch = async (userId, partnerName, matchScore) => {
  return createNotification({
    userId,
    type: "partner_match",
    title: "New study partner match!",
    message: `${partnerName} is a ${matchScore}% match for you. Connect and study together!`,
    priority: "medium",
    data: { partnerName, matchScore },
  });
};

const sendPartnerAccepted = async (userId, partnerName) => {
  return createNotification({
    userId,
    type: "partner_accepted",
    title: "Study partner request accepted",
    message: `${partnerName} accepted your study partner request. You can start collaborating now.`,
    priority: "medium",
    data: { partnerName },
  });
};

module.exports = {
  setIO,
  createNotification,
  sendStudyReminder,
  sendPerformanceAlert,
  sendSpacedRepetitionAlert,
  sendStreakAlert,
  sendBadgeEarned,
  sendPartnerMatch,
  sendPartnerAccepted,
};

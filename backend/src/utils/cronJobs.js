const cron = require('node-cron');
const User = require('../models/User');
const Flashcard = require('../models/Flashcard');
const Timetable = require('../models/Timetable');
const notificationService = require('../services/notificationService');

const startCronJobs = () => {
  // Daily study reminders — 7 AM Zimbabwe time (UTC+2)
  cron.schedule('0 5 * * *', async () => {
    console.log('[CRON] Running daily study reminders');
    try {
      const users = await User.find({ isActive: true, isEmailVerified: true }).select('_id name');
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      for (const user of users) {
        const timetable = await Timetable.findOne({ user: user._id, isActive: true });
        if (!timetable) continue;

        const todaySlots = timetable.slots.filter((s) => s.day === today && !s.isCompleted && s.type !== 'rest');
        for (const slot of todaySlots.slice(0, 2)) {
          await notificationService.sendStudyReminder(user._id, slot.subject, slot.startTime);
        }
      }
    } catch (err) {
      console.error('[CRON] Study reminders error:', err);
    }
  });

  // Spaced repetition alerts — every morning at 8 AM UTC+2
  cron.schedule('0 6 * * *', async () => {
    console.log('[CRON] Running spaced repetition alerts');
    try {
      const now = new Date();
      const users = await User.find({ isActive: true, isEmailVerified: true }).select('_id');

      for (const user of users) {
        const dueCards = await Flashcard.find({
          user: user._id,
          isActive: true,
          nextReviewDate: { $lte: now },
        }).select('subject').limit(10);

        if (dueCards.length > 0) {
          const topics = [...new Set(dueCards.map((c) => c.subject).filter(Boolean))];
          await notificationService.sendSpacedRepetitionAlert(user._id, topics.slice(0, 3));
        }
      }
    } catch (err) {
      console.error('[CRON] Spaced repetition error:', err);
    }
  });

  // Streak check — midnight daily
  cron.schedule('0 22 * * *', async () => {
    console.log('[CRON] Checking streaks');
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      yesterday.setHours(0, 0, 0, 0);

      const usersAtRisk = await User.find({
        isActive: true,
        'streak.current': { $gte: 3 },
        'streak.lastStudyDate': { $lt: yesterday },
      }).select('_id name streak');

      for (const user of usersAtRisk) {
        await notificationService.createNotification({
          userId: user._id,
          type: 'ai_coach',
          title: 'Don\'t break your streak!',
          message: `You have a ${user.streak.current}-day streak. Study something today to keep it alive!`,
          priority: 'high',
        });
      }
    } catch (err) {
      console.error('[CRON] Streak check error:', err);
    }
  });

  console.log('[CRON] All scheduled jobs started');
};

module.exports = { startCronJobs };

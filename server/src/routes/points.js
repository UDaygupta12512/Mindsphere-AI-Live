import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { getCompleteAnalytics } from '../services/analyticsService.js';

const router = express.Router();
const VALID_AWARD_CATEGORIES = new Set([
  'course_completion',
  'participation',
  'daily_login',
  'other'
]);

// All routes require authentication
router.use(authMiddleware);

const getUserWithCourses = async (userId) => {
  return User.findById(userId)
    .populate('courses')
    .populate('enrolledCourses');
};

const calculateLevel = (points) => {
  let level = 1;
  let threshold = 100;
  let accumulated = 0;

  while (points >= accumulated + threshold) {
    accumulated += threshold;
    level++;
    threshold = Math.floor(threshold * 1.5);
  }

  return {
    level,
    currentLevelPoints: accumulated,
    nextLevelPoints: accumulated + threshold
  };
};

const buildPointsPayload = (overview = {}) => {
  const courseCompletionPoints = (overview.totalCoursesCompleted || 0) * 100;
  const lessonPoints = (overview.totalLessonsCompleted || 0) * 10;
  const quizPoints = Math.round(
    (overview.averageQuizScore || 0) * (overview.totalQuizzesTaken || 0) * 0.5
  );
  const streakPoints = (overview.currentStreak || 0) * 5;

  const total = courseCompletionPoints + lessonPoints + quizPoints + streakPoints;
  const levelInfo = calculateLevel(total);

  return {
    total,
    byCategory: {
      courseCompletion: courseCompletionPoints,
      participation: lessonPoints + quizPoints,
      dailyLogin: streakPoints,
      other: 0
    },
    level: levelInfo.level,
    nextLevelPoints: levelInfo.nextLevelPoints,
    currentLevelPoints: levelInfo.currentLevelPoints
  };
};

// GET /api/points - Get user's points and level
router.get('/', async (req, res) => {
  try {
    const user = await getUserWithCourses(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const analytics = await getCompleteAnalytics(user);
    res.json(buildPointsPayload(analytics.overview || {}));
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ error: 'Failed to fetch points' });
  }
});

// POST /api/points/award - Award points
// Note: points are derived from user activity, so this endpoint validates input
// and returns the latest computed points payload for compatibility.
router.post('/award', async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const category = req.body?.category;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    if (!VALID_AWARD_CATEGORIES.has(category)) {
      return res.status(400).json({ error: 'Invalid points category' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    const user = await getUserWithCourses(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const analytics = await getCompleteAnalytics(user);
    const pointsPayload = buildPointsPayload(analytics.overview || {});

    res.json({
      ...pointsPayload,
      awarded: amount,
      category,
      reason,
      message: 'Points are derived from learning activity. Returned latest totals.'
    });
  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({ error: 'Failed to award points' });
  }
});

export default router;

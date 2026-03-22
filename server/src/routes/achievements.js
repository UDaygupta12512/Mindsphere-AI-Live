import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { getCompleteAnalytics } from '../services/analyticsService.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/achievements - Get all achievements for current user
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('courses')
      .populate('enrolledCourses');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const analytics = await getCompleteAnalytics(user);
    const achievements = analytics.achievements || [];

    // Map to frontend Achievement interface
    const mappedAchievements = achievements.map((a, index) => ({
      id: a.id || `achievement-${index}`,
      title: a.name || a.title || 'Achievement',
      description: a.description || '',
      icon: a.icon || '🏆',
      points: a.points || 10,
      type: mapAchievementType(a.id || ''),
      criteria: {
        type: a.criteria?.type || 'progress',
        target: a.criteria?.target || 100
      },
      unlocked: !!a.unlockedDate,
      unlockedAt: a.unlockedDate ? new Date(a.unlockedDate) : undefined
    }));

    res.json(mappedAchievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// POST /api/achievements/:id/unlock - Unlock an achievement
router.post('/:id/unlock', async (req, res) => {
  try {
    // Achievements are computed, not stored separately - just return success
    res.json({
      id: req.params.id,
      unlocked: true,
      unlockedAt: new Date()
    });
  } catch (error) {
    console.error('Unlock achievement error:', error);
    res.status(500).json({ error: 'Failed to unlock achievement' });
  }
});

function mapAchievementType(id) {
  if (id.includes('course') || id.includes('complete')) return 'course_completion';
  if (id.includes('streak')) return 'streak';
  if (id.includes('quiz') || id.includes('score')) return 'milestone';
  if (id.includes('lesson') || id.includes('learn')) return 'participation';
  return 'other';
}

export default router;

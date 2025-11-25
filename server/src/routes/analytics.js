/**
 * Analytics Routes
 * API endpoints for user analytics and dashboard data
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';
import { getCompleteAnalytics } from '../services/analyticsService.js';

const router = express.Router();

/**
 * GET /api/analytics
 * Get complete analytics dashboard data for authenticated user
 * Requires: Authentication token
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get user with populated BOTH enrolled courses (catalog) AND created courses
    const user = await User.findById(req.userId)
      .populate({
        path: 'enrolledCourses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt topics'
      })
      .populate({
        path: 'courses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt topics'
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate and return analytics
    const analytics = getCompleteAnalytics(user);
    
    console.log('📊 Analytics calculated:', {
      totalCoursesEnrolled: analytics.overview.totalCoursesEnrolled,
      totalLessonsCompleted: analytics.overview.totalLessonsCompleted,
      averageQuizScore: analytics.overview.averageQuizScore,
      enrolledCourses: user.enrolledCourses?.length || 0,
      createdCourses: user.courses?.length || 0
    });
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      details: error.message 
    });
  }
});

/**
 * GET /api/analytics/overview
 * Get quick overview stats
 * Requires: Authentication token
 */
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'enrolledCourses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt'
      })
      .populate({
        path: 'courses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt'
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const analytics = getCompleteAnalytics(user);
    
    res.json({
      success: true,
      data: analytics.overview
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics overview',
      details: error.message 
    });
  }
});

/**
 * GET /api/analytics/courses
 * Get course progress data
 * Requires: Authentication token
 */
router.get('/courses', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'enrolledCourses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt'
      })
      .populate({
        path: 'courses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt'
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const analytics = getCompleteAnalytics(user);
    
    res.json({
      success: true,
      data: analytics.courseProgress
    });
  } catch (error) {
    console.error('Error fetching course analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch course analytics',
      details: error.message 
    });
  }
});

/**
 * GET /api/analytics/activity
 * Get daily and weekly activity data
 * Requires: Authentication token
 */
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'enrolledCourses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt'
      })
      .populate({
        path: 'courses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt'
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const analytics = getCompleteAnalytics(user);
    
    res.json({
      success: true,
      data: {
        dailyActivity: analytics.dailyActivity,
        weeklyStats: analytics.weeklyStats
      }
    });
  } catch (error) {
    console.error('Error fetching activity analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch activity analytics',
      details: error.message 
    });
  }
});

/**
 * GET /api/analytics/achievements
 * Get user achievements and badges
 * Requires: Authentication token
 */
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'enrolledCourses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt'
      })
      .populate({
        path: 'courses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt'
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const analytics = getCompleteAnalytics(user);
    
    res.json({
      success: true,
      data: analytics.achievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ 
      error: 'Failed to fetch achievements',
      details: error.message 
    });
  }
});

/**
 * GET /api/analytics/learning-stats
 * Get learning statistics
 * Requires: Authentication token
 */
router.get('/learning-stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'enrolledCourses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt topics'
      })
      .populate({
        path: 'courses',
        select: 'title lessons quizzes progress completedLessons lastAccessed createdAt topics'
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const analytics = getCompleteAnalytics(user);
    
    res.json({
      success: true,
      data: analytics.learningStats
    });
  } catch (error) {
    console.error('Error fetching learning stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch learning stats',
      details: error.message 
    });
  }
});

export default router;
 
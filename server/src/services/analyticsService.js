/**
 * Analytics Service
 * Calculates learning statistics, progress, and achievements for users
 */

// Helper function to calculate days between dates
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs((date2 - date1) / oneDay));
};

// Helper function to get date in YYYY-MM-DD format
const getDateString = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// Helper function to get week label
const getWeekLabel = (date = new Date()) => {
  const week = Math.floor((new Date(date).getDate() - 1) / 7) + 1;
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `Week ${week} ${month} ${year}`;
};

/**
 * Calculate overall learning analytics for a user
 * @param {Object} user - User document with courses
 * @returns {Object} Analytics overview
 */
export const calculateAnalyticsOverview = (user) => {
  try {
    const now = new Date();
    // Combine both enrolled courses (from catalog) AND user-created courses
    const enrolledCourses = user.enrolledCourses || [];
    const createdCourses = user.courses || [];
    const allCourses = [...enrolledCourses, ...createdCourses];
    
    let totalCoursesCompleted = 0;
    let totalLessonsCompleted = 0;
    let totalQuizzesTaken = 0;
    let totalQuizScores = 0;
    let totalStudyTime = 0; // in minutes
    
    // If no courses at all, return empty overview
    if (!allCourses || allCourses.length === 0) {
      return {
        totalCoursesEnrolled: 0,
        totalCoursesCompleted: 0,
        totalLessonsCompleted: 0,
        averageQuizScore: 0,
        totalStudyTime: 0,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        lastActivityDate: getDateString(user.lastActivityDate || now)
      };
    }
    
    // Analyze each course
    allCourses.forEach(course => {
      // Check if course is completed (progress >= 100 or all lessons done)
      const progress = course.progress || 0;
      if (progress >= 100) {
        totalCoursesCompleted++;
      }
      
      // Count completed lessons from lessons array
      const completedLessons = course.lessons?.filter(l => l.isCompleted)?.length || 0;
      totalLessonsCompleted += completedLessons;
      
      // Calculate study time
      const lessonTime = completedLessons * 30;
      
      // Count completed quizzes
      const completedQuizzes = course.quizzes?.filter(q => q.completedAt && q.score !== undefined) || [];
      totalQuizzesTaken += completedQuizzes.length;
      const quizTime = completedQuizzes.length * 15;
      totalStudyTime += lessonTime + quizTime;
      
      // Sum quiz scores
      if (completedQuizzes.length > 0) {
        totalQuizScores += completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
      }
    });
    
    // Calculate average quiz score
    const averageQuizScore = totalQuizzesTaken > 0 
      ? Math.round(totalQuizScores / totalQuizzesTaken)
      : 0;
    
    // Calculate study streak (simplified - based on last activity)
    const lastActivityDate = user.lastActivityDate ? new Date(user.lastActivityDate) : now;
    const daysSinceLastActivity = daysBetween(lastActivityDate, now);
    const currentStreak = daysSinceLastActivity <= 1 ? (user.currentStreak || 0) + 1 : 0;
    const longestStreak = Math.max(currentStreak, user.longestStreak || 0);
    
    return {
      totalCoursesEnrolled: allCourses.length,
      totalCoursesCompleted,
      totalLessonsCompleted,
      averageQuizScore,
      totalStudyTime: Math.round(totalStudyTime),
      currentStreak,
      longestStreak,
      lastActivityDate: getDateString(lastActivityDate)
    };
  } catch (error) {
    console.error('Error calculating analytics overview:', error);
    return {
      totalCoursesEnrolled: 0,
      totalCoursesCompleted: 0,
      totalLessonsCompleted: 0,
      averageQuizScore: 0,
      totalStudyTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: getDateString()
    };
  }
};

/**
 * Calculate progress for each course
 * @param {Array} courses - User's courses
 * @returns {Array} Array of course progress objects
 */
export const calculateCourseProgress = (courses) => {
  try {
    return courses.map(course => {
      const totalLessons = course.lessons?.length || 0;
      
      // Count completed lessons from the lessons array (isCompleted flag)
      const lessonsCompleted = course.lessons?.filter(lesson => lesson.isCompleted)?.length || 0;
      
      // Use the course's progress field or calculate from lessons
      const progress = course.progress !== undefined ? course.progress : 
                      (totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0);
      
      // Calculate average quiz score from quizzes array
      const quizzes = course.quizzes || [];
      const completedQuizzes = quizzes.filter(q => q.completedAt && q.score !== undefined);
      const averageQuizScore = completedQuizzes.length > 0
        ? Math.round(completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / completedQuizzes.length)
        : 0;
      
      // Estimate time spent
      const timeSpent = lessonsCompleted * 30 + completedQuizzes.length * 15; // in minutes
      
      // Determine status
      let status = 'Not Started';
      if (progress > 0 && progress < 100) status = 'In Progress';
      if (progress >= 100) status = 'Completed';
      
      return {
        courseId: course._id?.toString() || '',
        courseTitle: course.title || '',
        progress,
        lessonsCompleted,
        totalLessons,
        quizzesTaken: completedQuizzes.length,
        averageQuizScore,
        timeSpent: Math.round(timeSpent),
        enrolledDate: course.createdAt ? getDateString(new Date(course.createdAt)) : getDateString(),
        lastAccessedDate: course.lastAccessed ? getDateString(new Date(course.lastAccessed)) : getDateString(),
        status
      };
    }).sort((a, b) => b.progress - a.progress); // Sort by progress descending
  } catch (error) {
    console.error('Error calculating course progress:', error);
    return [];
  }
};

/**
 * Calculate daily activity stats
 * @param {Array} courses - User's courses
 * @returns {Array} Array of daily activity for last 30 days
 */
export const calculateDailyActivity = (courses) => {
  try {
    const activityMap = new Map();
    const today = new Date();
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getDateString(date);
      activityMap.set(dateStr, {
        date: dateStr,
        lessonsCompleted: 0,
        quizzesTaken: 0,
        timeSpent: 0,
        flashcardsReviewed: 0
      });
    }
    
    // Aggregate activity from courses
    // Note: Since we don't have exact timestamps for lesson completion,
    // we estimate based on lastAccessed date
    courses.forEach(course => {
      if (course.lastAccessed) {
        const dateStr = getDateString(new Date(course.lastAccessed));
        if (activityMap.has(dateStr)) {
          const activity = activityMap.get(dateStr);
          
          // Count completed lessons
          const completedLessons = course.lessons?.filter(l => l.isCompleted)?.length || 0;
          activity.lessonsCompleted += completedLessons;
          activity.timeSpent += completedLessons * 30; // 30 min per lesson
          
          // Count completed quizzes
          const completedQuizzes = course.quizzes?.filter(q => q.completedAt && q.score !== undefined)?.length || 0;
          activity.quizzesTaken += completedQuizzes;
          activity.timeSpent += completedQuizzes * 15; // 15 min per quiz
        }
      }
    });
    
    return Array.from(activityMap.values());
  } catch (error) {
    console.error('Error calculating daily activity:', error);
    return [];
  }
};

/**
 * Calculate weekly statistics
 * @param {Array} dailyActivity - Daily activity data
 * @returns {Array} Array of weekly stats
 */
export const calculateWeeklyStats = (dailyActivity) => {
  try {
    const weekMap = new Map();
    
    dailyActivity.forEach(day => {
      const date = new Date(day.date);
      const weekLabel = getWeekLabel(date);
      
      if (!weekMap.has(weekLabel)) {
        weekMap.set(weekLabel, {
          week: weekLabel,
          lessonsCompleted: 0,
          quizzesTaken: 0,
          totalTimeSpent: 0,
          quizScores: [],
          flashcardsReviewed: 0
        });
      }
      
      const week = weekMap.get(weekLabel);
      week.lessonsCompleted += day.lessonsCompleted;
      week.quizzesTaken += day.quizzesTaken;
      week.totalTimeSpent += day.timeSpent;
      week.flashcardsReviewed += day.flashcardsReviewed;
    });
    
    return Array.from(weekMap.values()).map(week => ({
      week: week.week,
      lessonsCompleted: week.lessonsCompleted,
      quizzesTaken: week.quizzesTaken,
      totalTimeSpent: week.totalTimeSpent,
      averageQuizScore: week.quizScores.length > 0 
        ? Math.round(week.quizScores.reduce((a, b) => a + b) / week.quizScores.length)
        : 0,
      flashcardsReviewed: week.flashcardsReviewed
    }));
  } catch (error) {
    console.error('Error calculating weekly stats:', error);
    return [];
  }
};

/**
 * Calculate unlocked achievements/badges
 * @param {Object} overview - Analytics overview
 * @param {Array} courseProgress - Course progress data
 * @returns {Array} Array of achievements
 */
export const calculateAchievements = (overview, courseProgress) => {
  try {
    const achievements = [];
    
    // Early Bird - 5+ lessons in first week
    if (overview.totalLessonsCompleted >= 5) {
      achievements.push({
        id: 'early-bird',
        name: '🐦 Early Bird',
        description: 'Completed 5+ lessons',
        icon: '🐦',
        progress: Math.min(100, (overview.totalLessonsCompleted / 5) * 100),
        unlockedDate: overview.totalLessonsCompleted >= 5 ? new Date().toISOString() : undefined
      });
    }
    
    // Course Starter - 1 course
    if (overview.totalCoursesEnrolled >= 1) {
      achievements.push({
        id: 'starter',
        name: '🎓 Course Starter',
        description: 'Enrolled in 1 course',
        icon: '🎓',
        progress: 100,
        unlockedDate: new Date().toISOString()
      });
    }
    
    // Learner - 3+ courses
    if (overview.totalCoursesEnrolled >= 3) {
      achievements.push({
        id: 'learner',
        name: '📚 Learner',
        description: 'Enrolled in 3+ courses',
        icon: '📚',
        progress: Math.min(100, (overview.totalCoursesEnrolled / 3) * 100),
        unlockedDate: new Date().toISOString()
      });
    }
    
    // Course Completer - 1 course completed
    if (overview.totalCoursesCompleted >= 1) {
      achievements.push({
        id: 'completer',
        name: '✅ Course Completer',
        description: 'Completed 1 course',
        icon: '✅',
        progress: 100,
        unlockedDate: new Date().toISOString()
      });
    }
    
    // Quiz Master - Average score > 80
    if (overview.averageQuizScore >= 80) {
      achievements.push({
        id: 'quiz-master',
        name: '⭐ Quiz Master',
        description: 'Average quiz score above 80%',
        icon: '⭐',
        progress: 100,
        unlockedDate: new Date().toISOString()
      });
    }
    
    // Fire - 7 day streak
    if (overview.currentStreak >= 7) {
      achievements.push({
        id: 'on-fire',
        name: '🔥 On Fire',
        description: '7 day study streak',
        icon: '🔥',
        progress: Math.min(100, (overview.currentStreak / 7) * 100),
        unlockedDate: new Date().toISOString()
      });
    }
    
    // Study Warrior - 100+ hours
    if (overview.totalStudyTime >= 6000) { // 100 hours in minutes
      achievements.push({
        id: 'warrior',
        name: '⚔️ Study Warrior',
        description: '100+ hours of study',
        icon: '⚔️',
        progress: Math.min(100, (overview.totalStudyTime / 6000) * 100),
        unlockedDate: new Date().toISOString()
      });
    }
    
    return achievements;
  } catch (error) {
    console.error('Error calculating achievements:', error);
    return [];
  }
};

/**
 * Calculate learning statistics
 * @param {Array} dailyActivity - Daily activity data
 * @param {Array} courses - User's courses
 * @returns {Object} Learning statistics
 */
export const calculateLearningStats = (dailyActivity, courses) => {
  try {
    const totalMinutesLearned = dailyActivity.reduce((sum, day) => sum + day.timeSpent, 0);
    const daysWithActivity = dailyActivity.filter(day => day.timeSpent > 0).length;
    const averageStudySession = daysWithActivity > 0 ? Math.round(totalMinutesLearned / daysWithActivity) : 0;
    
    // Most active day
    const dayActivityMap = new Map();
    dailyActivity.forEach(day => {
      const date = new Date(day.date);
      const dayName = date.toLocaleString('default', { weekday: 'long' });
      if (!dayActivityMap.has(dayName)) {
        dayActivityMap.set(dayName, 0);
      }
      dayActivityMap.set(dayName, dayActivityMap.get(dayName) + day.timeSpent);
    });
    
    let mostActiveDay = 'Monday';
    let maxTime = 0;
    dayActivityMap.forEach((time, day) => {
      if (time > maxTime) {
        maxTime = time;
        mostActiveDay = day;
      }
    });
    
    // Topics
    const topics = new Set();
    courses.forEach(course => {
      if (course.topics) {
        course.topics.forEach(topic => topics.add(topic));
      }
    });
    
    return {
      totalMinutesLearned,
      averageStudySession,
      preferredStudyTime: 'Flexible', // Could be enhanced with time-based tracking
      mostActiveDay,
      topicsMastered: Array.from(topics).slice(0, 3),
      topicsInProgress: Array.from(topics).slice(3)
    };
  } catch (error) {
    console.error('Error calculating learning stats:', error);
    return {
      totalMinutesLearned: 0,
      averageStudySession: 0,
      preferredStudyTime: 'Flexible',
      mostActiveDay: 'Monday',
      topicsMastered: [],
      topicsInProgress: []
    };
  }
};

/**
 * Get complete analytics dashboard data for a user
 * @param {Object} user - User document
 * @returns {Object} Complete analytics data
 */
export const getCompleteAnalytics = (user) => {
  try {
    // Combine both enrolled courses (from catalog) AND user-created courses
    const enrolledCourses = user.enrolledCourses || [];
    const createdCourses = user.courses || [];
    const allCourses = [...enrolledCourses, ...createdCourses];
    
    const overview = calculateAnalyticsOverview(user);
    const courseProgress = calculateCourseProgress(allCourses);
    const dailyActivity = calculateDailyActivity(allCourses);
    const weeklyStats = calculateWeeklyStats(dailyActivity);
    const achievements = calculateAchievements(overview, courseProgress);
    const learningStats = calculateLearningStats(dailyActivity, allCourses);
    
    return {
      overview,
      courseProgress,
      dailyActivity,
      weeklyStats,
      achievements,
      learningStats
    };
  } catch (error) {
    console.error('Error getting complete analytics:', error);
    throw error;
  }
};
 
export interface AnalyticsOverview {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalLessonsCompleted: number;
  averageQuizScore: number;
  totalStudyTime: number; // in minutes
  currentStreak: number; // days
  longestStreak: number; // days
  lastActivityDate: string;
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  progress: number; // 0-100
  lessonsCompleted: number;
  totalLessons: number;
  quizzesTaken: number;
  averageQuizScore: number;
  timeSpent: number; // in minutes
  enrolledDate: string;
  lastAccessedDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface DailyActivity {
  date: string;
  lessonsCompleted: number;
  quizzesTaken: number;
  timeSpent: number; // in minutes
  flashcardsReviewed: number;
}

export interface WeeklyStats {
  week: string; // e.g., "Week 1 Nov 2025"
  lessonsCompleted: number;
  quizzesTaken: number;
  totalTimeSpent: number;
  averageQuizScore: number;
  flashcardsReviewed: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedDate?: string;
  progress: number; // 0-100 for badges in progress
}

export interface LearningStats {
  totalMinutesLearned: number;
  averageStudySession: number; // in minutes
  preferredStudyTime: string; // e.g., "Morning", "Evening"
  mostActiveDay: string;
  topicsMastered: string[];
  topicsInProgress: string[];
}

export interface AnalyticsDashboardData {
  overview: AnalyticsOverview;
  courseProgress: CourseProgress[];
  dailyActivity: DailyActivity[];
  weeklyStats: WeeklyStats[];
  achievements: Achievement[];
  learningStats: LearningStats;
}
 